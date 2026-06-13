const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PrepaidGrid Smart Contract", function () {
    let prepaidGrid;
    let owner;
    let user1;
    let user2;

    beforeEach(async function () {
        // Get signers
        [owner, user1, user2] = await ethers.getSigners();

        // Deploy contract
        const PrepaidGrid = await ethers.getContractFactory("PrepaidGrid");
        prepaidGrid = await PrepaidGrid.deploy();
        await prepaidGrid.deployed();
    });

    describe("Token Purchase", function () {
        it("Should allow users to purchase tokens", async function () {
            const amount = ethers.utils.parseEther("10");
            await prepaidGrid.connect(user1).purchaseTokens(amount, { value: amount });

            const balance = await prepaidGrid.getBalance(user1.address);
            expect(balance).to.equal(amount);
        });

        it("Should revert if amount is zero", async function () {
            await expect(
                prepaidGrid.connect(user1).purchaseTokens(0, { value: 0 })
            ).to.be.revertedWith("Amount must be greater than 0");
        });

        it("Should revert if payment is incorrect", async function () {
            const amount = ethers.utils.parseEther("10");
            await expect(
                prepaidGrid.connect(user1).purchaseTokens(amount, { 
                    value: ethers.utils.parseEther("5") 
                })
            ).to.be.revertedWith("Incorrect payment amount");
        });

        it("Should authorize user after purchase", async function () {
            const amount = ethers.utils.parseEther("10");
            await prepaidGrid.connect(user1).purchaseTokens(amount, { value: amount });

            const isAuthorized = await prepaidGrid.checkAuthorization(user1.address);
            expect(isAuthorized).to.be.true;
        });
    });

    describe("Balance Management", function () {
        beforeEach(async function () {
            const amount = ethers.utils.parseEther("100");
            await prepaidGrid.connect(user1).purchaseTokens(amount, { value: amount });
        });

        it("Should deduct balance on consumption", async function () {
            const deductAmount = ethers.utils.parseEther("10");
            await prepaidGrid.connect(owner).deductBalance(user1.address, deductAmount);

            const remainingBalance = await prepaidGrid.getBalance(user1.address);
            expect(remainingBalance).to.equal(ethers.utils.parseEther("90"));
        });

        it("Should trigger cutoff when balance insufficient", async function () {
            const fullBalance = ethers.utils.parseEther("100");
            await prepaidGrid.connect(owner).deductBalance(user1.address, fullBalance);

            const isAuthorized = await prepaidGrid.checkAuthorization(user1.address);
            expect(isAuthorized).to.be.false;
        });

        it("Should emit ConsumptionDeducted event", async function () {
            const deductAmount = ethers.utils.parseEther("10");
            await expect(
                prepaidGrid.connect(owner).deductBalance(user1.address, deductAmount)
            ).to.emit(prepaidGrid, "ConsumptionDeducted");
        });
    });

    describe("Anomaly Detection & Cutoff", function () {
        beforeEach(async function () {
            const amount = ethers.utils.parseEther("100");
            await prepaidGrid.connect(user1).purchaseTokens(amount, { value: amount });
        });

        it("Should trigger cutoff on anomaly", async function () {
            await prepaidGrid.connect(owner).triggerAnomalyCutoff(
                user1.address,
                "THEFT_DETECTED",
                50
            );

            const isAuthorized = await prepaidGrid.checkAuthorization(user1.address);
            expect(isAuthorized).to.be.false;

            const hasAnomaly = await prepaidGrid.hasAnomalyFlagStatus(user1.address);
            expect(hasAnomaly).to.be.true;
        });

        it("Should emit CutoffTriggered event on anomaly", async function () {
            await expect(
                prepaidGrid.connect(owner).triggerAnomalyCutoff(
                    user1.address,
                    "THEFT_DETECTED",
                    75
                )
            ).to.emit(prepaidGrid, "CutoffTriggered")
            .withArgs(user1.address, "THEFT_DETECTED", expect.anything());
        });

        it("Should allow clearing anomaly and reauthorizing", async function () {
            await prepaidGrid.connect(owner).triggerAnomalyCutoff(
                user1.address,
                "THEFT_DETECTED",
                50
            );

            const newBalance = ethers.utils.parseEther("50");
            await prepaidGrid.connect(owner).clearAnomalyAndReauthorize(
                user1.address,
                newBalance
            );

            const isAuthorized = await prepaidGrid.checkAuthorization(user1.address);
            expect(isAuthorized).to.be.true;

            const hasAnomaly = await prepaidGrid.hasAnomalyFlagStatus(user1.address);
            expect(hasAnomaly).to.be.false;

            const balance = await prepaidGrid.getBalance(user1.address);
            expect(balance).to.equal(newBalance);
        });
    });

    describe("Authorization Management", function () {
        beforeEach(async function () {
            const amount = ethers.utils.parseEther("100");
            await prepaidGrid.connect(user1).purchaseTokens(amount, { value: amount });
        });

        it("Should allow owner to reauthorize user", async function () {
            await prepaidGrid.connect(owner).deauthorizeUser(user1.address);
            await prepaidGrid.connect(owner).reauthorizeUser(user1.address);

            const isAuthorized = await prepaidGrid.checkAuthorization(user1.address);
            expect(isAuthorized).to.be.true;
        });

        it("Should allow owner to deauthorize user", async function () {
            await prepaidGrid.connect(owner).deauthorizeUser(user1.address);

            const isAuthorized = await prepaidGrid.checkAuthorization(user1.address);
            expect(isAuthorized).to.be.false;
        });

        it("Should only allow owner to manage authorization", async function () {
            await expect(
                prepaidGrid.connect(user2).deauthorizeUser(user1.address)
            ).to.be.revertedWith("Only owner can call this function");
        });
    });

    describe("Statistics", function () {
        it("Should track total distributed tokens", async function () {
            const amount1 = ethers.utils.parseEther("50");
            const amount2 = ethers.utils.parseEther("30");

            await prepaidGrid.connect(user1).purchaseTokens(amount1, { value: amount1 });
            await prepaidGrid.connect(user2).purchaseTokens(amount2, { value: amount2 });

            const stats = await prepaidGrid.getStatistics();
            expect(stats.distributed).to.equal(ethers.utils.parseEther("80"));
        });

        it("Should track total consumed tokens", async function () {
            const amount = ethers.utils.parseEther("100");
            await prepaidGrid.connect(user1).purchaseTokens(amount, { value: amount });

            const deductAmount = ethers.utils.parseEther("25");
            await prepaidGrid.connect(owner).deductBalance(user1.address, deductAmount);

            const stats = await prepaidGrid.getStatistics();
            expect(stats.consumed).to.equal(deductAmount);
        });
    });

    describe("Fallback & Withdrawal", function () {
        it("Should accept ether via fallback", async function () {
            const amount = ethers.utils.parseEther("5");
            await owner.sendTransaction({
                to: prepaidGrid.address,
                value: amount
            });

            const stats = await prepaidGrid.getStatistics();
            expect(stats.balance).to.equal(amount);
        });

        it("Should allow emergency withdrawal by owner", async function () {
            const amount = ethers.utils.parseEther("5");
            await owner.sendTransaction({
                to: prepaidGrid.address,
                value: amount
            });

            const ownerBalanceBefore = await owner.getBalance();
            const tx = await prepaidGrid.connect(owner).emergencyWithdraw();
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);

            const ownerBalanceAfter = await owner.getBalance();
            expect(ownerBalanceAfter).to.be.closeTo(
                ownerBalanceBefore.add(amount).sub(gasUsed),
                ethers.utils.parseEther("0.01")
            );
        });
    });
});
