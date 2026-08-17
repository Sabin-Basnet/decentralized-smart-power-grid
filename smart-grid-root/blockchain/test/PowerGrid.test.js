const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PowerGrid", function () {
  let powerGrid;
  let owner;
  let meter;

  beforeEach(async function () {
    [owner, meter] = await ethers.getSigners();
    const PowerGrid = await ethers.getContractFactory("PowerGrid");
    powerGrid = await PowerGrid.deploy();
    await powerGrid.waitForDeployment();
  });

  it("funds a meter and deducts based on energy consumption", async function () {
    const initialBalance = 100n;
    await powerGrid.connect(owner).fundAccount(meter.address, initialBalance);

    await powerGrid.connect(owner).deductForConsumption(meter.address, 25n);

    expect(await powerGrid.getBalance(meter.address)).to.equal(75n);
    expect(await powerGrid.isBalanceZero(meter.address)).to.equal(false);
  });

  it("marks a depleted account as isolated", async function () {
    await powerGrid.connect(owner).fundAccount(meter.address, 10n);
    await powerGrid.connect(owner).deductForConsumption(meter.address, 10n);

    expect(await powerGrid.getBalance(meter.address)).to.equal(0n);
    expect(await powerGrid.isBalanceZero(meter.address)).to.equal(true);
  });
});
