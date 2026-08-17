// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PowerGrid {
    address public owner;

    mapping(address => uint256) private balances;

    event TokensFunded(address indexed meter, uint256 amount, uint256 timestamp);
    event ConsumptionDeducted(
        address indexed meter,
        uint256 amount,
        uint256 remainingBalance,
        uint256 timestamp
    );

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    function fundAccount(address _meter, uint256 _amount) external onlyOwner {
        require(_meter != address(0), "Invalid meter address");
        require(_amount > 0, "Amount must be greater than 0");

        balances[_meter] += _amount;
        emit TokensFunded(_meter, _amount, block.timestamp);
    }

    function getBalance(address _meter) external view returns (uint256) {
        return balances[_meter];
    }

    function deductForConsumption(address _meter, uint256 _energyConsumed) external onlyOwner {
        require(_meter != address(0), "Invalid meter address");
        require(_energyConsumed > 0, "Energy consumption must be greater than 0");

        if (balances[_meter] <= _energyConsumed) {
            balances[_meter] = 0;
            emit ConsumptionDeducted(_meter, _energyConsumed, 0, block.timestamp);
            return;
        }

        balances[_meter] -= _energyConsumed;
        emit ConsumptionDeducted(_meter, _energyConsumed, balances[_meter], block.timestamp);
    }

    function isBalanceZero(address _meter) external view returns (bool) {
        return balances[_meter] <= 0;
    }
}
