// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title PrepaidGrid
 * @dev Smart contract for decentralized prepaid electricity distribution system
 * Manages user balances, consumption tracking, and anomaly-triggered cutoffs
 */
contract PrepaidGrid {
    
    // ======================== STATE VARIABLES ========================
    
    /// @dev Owner of the contract (system administrator)
    address public owner;
    
    /// @dev Token price in wei per kWh (1 token = 1 kWh for simplicity)
    uint256 public tokenPricePerKwh = 1e18;
    
    /// @dev Mapping of wallet addresses to their prepaid token balances
    mapping(address => uint256) public balances;
    
    /// @dev Mapping of wallet addresses to authorization status
    mapping(address => bool) public isAuthorized;
    
    /// @dev Mapping to track anomaly flags for users
    mapping(address => bool) public hasAnomalyFlag;
    
    /// @dev Mapping to track last consumption deduction timestamp
    mapping(address => uint256) public lastConsumptionUpdate;
    
    /// @dev Total tokens ever distributed
    uint256 public totalTokensDistributed = 0;
    
    /// @dev Total tokens ever consumed
    uint256 public totalTokensConsumed = 0;
    
    // ======================== EVENTS ========================
    
    /// @dev Emitted when a user purchases tokens
    event TokensPurchased(
        address indexed wallet,
        uint256 amount,
        uint256 timestamp
    );
    
    /// @dev Emitted when consumption is deducted from balance
    event ConsumptionDeducted(
        address indexed wallet,
        uint256 amount,
        uint256 remainingBalance,
        uint256 timestamp
    );
    
    /// @dev Emitted when user's cutoff is triggered (authorization revoked)
    event CutoffTriggered(
        address indexed wallet_address,
        string reason,
        uint256 timestamp
    );
    
    /// @dev Emitted when user is re-authorized
    event UserReauthorized(
        address indexed wallet,
        uint256 newBalance,
        uint256 timestamp
    );
    
    /// @dev Emitted when anomaly is detected
    event AnomalyDetected(
        address indexed wallet,
        string anomalyType,
        uint256 anomalyScore,
        uint256 timestamp
    );
    
    // ======================== MODIFIERS ========================
    
    /// @dev Restrict access to contract owner only
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    /// @dev Restrict to authorized users only
    modifier onlyAuthorized(address wallet) {
        require(isAuthorized[wallet], "User not authorized");
        _;
    }
    
    // ======================== CONSTRUCTOR ========================
    
    constructor() {
        owner = msg.sender;
    }
    
    // ======================== USER BALANCE MANAGEMENT ========================
    
    /**
     * @dev Purchase tokens for prepaid electricity credit
     * @param _amount Amount of tokens to purchase (in wei)
     */
    function purchaseTokens(uint256 _amount) external payable {
        require(_amount > 0, "Amount must be greater than 0");
        require(msg.value == _amount, "Incorrect payment amount");
        
        balances[msg.sender] += _amount;
        totalTokensDistributed += _amount;
        isAuthorized[msg.sender] = true;
        
        emit TokensPurchased(msg.sender, _amount, block.timestamp);
    }
    
    /**
     * @dev Get current balance for a user
     * @param _wallet User's wallet address
     * @return Current balance in tokens (wei)
     */
    function getBalance(address _wallet) external view returns (uint256) {
        return balances[_wallet];
    }
    
    /**
     * @dev Deduct consumption from user balance
     * Called by backend when telemetry indicates power consumption
     * @param _wallet User's wallet address
     * @param _amount Amount to deduct (in wei)
     */
    function deductBalance(address _wallet, uint256 _amount) external onlyOwner {
        require(_wallet != address(0), "Invalid wallet address");
        require(_amount > 0, "Amount must be greater than 0");
        
        // Check if user has sufficient balance
        if (balances[_wallet] < _amount) {
            // Insufficient balance - trigger cutoff
            balances[_wallet] = 0;
            isAuthorized[_wallet] = false;
            
            emit CutoffTriggered(
                _wallet,
                "INSUFFICIENT_BALANCE",
                block.timestamp
            );
        } else {
            // Sufficient balance - deduct and continue
            balances[_wallet] -= _amount;
            totalTokensConsumed += _amount;
            lastConsumptionUpdate[_wallet] = block.timestamp;
            
            emit ConsumptionDeducted(
                _wallet,
                _amount,
                balances[_wallet],
                block.timestamp
            );
        }
    }
    
    // ======================== ANOMALY DETECTION & CUTOFF ========================
    
    /**
     * @dev Trigger cutoff when anomaly is detected (theft detection, etc.)
     * @param _wallet User's wallet address
     * @param _anomalyType Type of anomaly detected
     * @param _anomalyScore Severity score (0-100)
     */
    function triggerAnomalyCutoff(
        address _wallet,
        string memory _anomalyType,
        uint256 _anomalyScore
    ) external onlyOwner {
        require(_wallet != address(0), "Invalid wallet address");
        require(_anomalyScore <= 100, "Score must be 0-100");
        
        hasAnomalyFlag[_wallet] = true;
        isAuthorized[_wallet] = false;
        
        emit AnomalyDetected(_wallet, _anomalyType, _anomalyScore, block.timestamp);
        emit CutoffTriggered(
            _wallet,
            _anomalyType,
            block.timestamp
        );
    }
    
    /**
     * @dev Clear anomaly flag and reauthorize user
     * @param _wallet User's wallet address
     * @param _newBalance New balance to set (after inspection/investigation)
     */
    function clearAnomalyAndReauthorize(address _wallet, uint256 _newBalance) 
        external 
        onlyOwner 
    {
        require(_wallet != address(0), "Invalid wallet address");
        
        hasAnomalyFlag[_wallet] = false;
        isAuthorized[_wallet] = true;
        balances[_wallet] = _newBalance;
        
        emit UserReauthorized(_wallet, _newBalance, block.timestamp);
    }
    
    /**
     * @dev Check if user has anomaly flag
     * @param _wallet User's wallet address
     * @return True if anomaly is flagged, false otherwise
     */
    function hasAnomalyFlagStatus(address _wallet) external view returns (bool) {
        return hasAnomalyFlag[_wallet];
    }
    
    // ======================== AUTHORIZATION MANAGEMENT ========================
    
    /**
     * @dev Manually reauthorize a user (admin override)
     * @param _wallet User's wallet address
     */
    function reauthorizeUser(address _wallet) external onlyOwner {
        require(_wallet != address(0), "Invalid wallet address");
        isAuthorized[_wallet] = true;
    }
    
    /**
     * @dev Manually deauthorize a user (admin override)
     * @param _wallet User's wallet address
     */
    function deauthorizeUser(address _wallet) external onlyOwner {
        require(_wallet != address(0), "Invalid wallet address");
        isAuthorized[_wallet] = false;
        
        emit CutoffTriggered(
            _wallet,
            "ADMIN_DEAUTHORIZATION",
            block.timestamp
        );
    }
    
    /**
     * @dev Check if user is currently authorized
     * @param _wallet User's wallet address
     * @return True if authorized, false otherwise
     */
    function checkAuthorization(address _wallet) external view returns (bool) {
        return isAuthorized[_wallet];
    }
    
    // ======================== ADMINISTRATIVE ========================
    
    /**
     * @dev Emergency withdrawal by owner
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
    
    /**
     * @dev Get contract statistics
     * @return balance Contract's ether balance
     * @return distributed Total tokens distributed
     * @return consumed Total tokens consumed
     */
    function getStatistics() external view returns (
        uint256 balance,
        uint256 distributed,
        uint256 consumed
    ) {
        return (
            address(this).balance,
            totalTokensDistributed,
            totalTokensConsumed
        );
    }
    
    /**
     * @dev Fallback function to receive ether
     */
    receive() external payable {}
}
