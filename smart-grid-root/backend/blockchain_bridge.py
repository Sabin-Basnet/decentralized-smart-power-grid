"""
blockchain_bridge.py - Web3.py integration for smart contract interaction and event listening
"""
from web3 import Web3
from web3.contract import Contract
import asyncio
import json
from datetime import datetime
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Blockchain Configuration
HARDHAT_RPC_URL = "http://127.0.0.1:8545"
CONTRACT_ADDRESS = None  # Will be set after contract deployment
CONTRACT_ABI = None  # Will be loaded from compiled contract
POLL_INTERVAL = 2  # seconds between event polls

class BlockchainBridge:
    """
    Web3.py bridge for interacting with PrepaidGrid smart contract.
    Listens for CutoffTriggered events and updates backend authorization state.
    """
    
    def __init__(self, rpc_url=HARDHAT_RPC_URL, contract_address=None, contract_abi=None):
        """
        Initialize Web3 connection and contract instance.
        
        Args:
            rpc_url: JSON-RPC endpoint for Ethereum/Hardhat node
            contract_address: Deployed smart contract address
            contract_abi: Contract ABI JSON
        """
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        self.contract = None
        self.last_block_checked = 0
        self.is_connected = False
        
        try:
            if self.w3.is_connected():
                self.is_connected = True
                logger.info(f"[BlockchainBridge] Connected to {rpc_url}")
                self.last_block_checked = self.w3.eth.block_number
                logger.info(f"[BlockchainBridge] Current block: {self.last_block_checked}")
            else:
                logger.warning(f"[BlockchainBridge] Failed to connect to {rpc_url}")
        except Exception as e:
            logger.error(f"[BlockchainBridge] Connection error: {e}")
        
        # Initialize contract if address and ABI provided
        if contract_address and contract_abi:
            self.set_contract(contract_address, contract_abi)
    
    def set_contract(self, address, abi):
        """
        Set the target smart contract.
        
        Args:
            address: Contract address (string, with or without 0x prefix)
            abi: Contract ABI (dict or JSON string)
        """
        try:
            # Ensure address has 0x prefix
            if not address.startswith('0x'):
                address = '0x' + address
            
            # Parse ABI if string
            if isinstance(abi, str):
                abi = json.loads(abi)
            
            # Create contract instance
            self.contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(address),
                abi=abi
            )
            
            logger.info(f"[BlockchainBridge] Contract set: {address}")
            return True
        
        except Exception as e:
            logger.error(f"[BlockchainBridge] Failed to set contract: {e}")
            return False
    
    def listen_for_cutoff_events(self, callback=None, poll_interval=POLL_INTERVAL):
        """
        Synchronous event listener loop for CutoffTriggered events.
        Polls the blockchain at regular intervals.
        
        Args:
            callback: Async function to call when event detected
                     Receives event dict as argument
            poll_interval: Polling interval in seconds
        """
        if not self.contract:
            logger.error("[BlockchainBridge] Contract not initialized!")
            return
        
        if not self.is_connected:
            logger.error("[BlockchainBridge] Not connected to blockchain!")
            return
        
        logger.info("[BlockchainBridge] Starting CutoffTriggered event listener...")
        
        try:
            while True:
                try:
                    # Get current block
                    current_block = self.w3.eth.block_number
                    
                    # Query for CutoffTriggered events from last checked to current block
                    event_filter = {
                        'fromBlock': self.last_block_checked,
                        'toBlock': current_block
                    }
                    
                    events = self.contract.events.CutoffTriggered.get_logs(**event_filter)
                    
                    # Process each event
                    for event in events:
                        logger.info(f"[BlockchainBridge] CutoffTriggered event detected!")
                        logger.info(f"  Wallet: {event.args.wallet_address}")
                        logger.info(f"  Reason: {event.args.reason}")
                        logger.info(f"  Timestamp: {event.args.timestamp}")
                        logger.info(f"  Block: {event.blockNumber}")
                        
                        # Execute callback if provided
                        if callback:
                            try:
                                callback(event)
                            except Exception as e:
                                logger.error(f"[BlockchainBridge] Callback error: {e}")
                    
                    # Update last checked block
                    self.last_block_checked = current_block + 1
                    
                except Exception as e:
                    logger.error(f"[BlockchainBridge] Error polling events: {e}")
                
                # Sleep before next poll
                asyncio.run(asyncio.sleep(poll_interval))
        
        except KeyboardInterrupt:
            logger.info("[BlockchainBridge] Event listener stopped.")
    
    def get_user_balance(self, wallet_address):
        """
        Query user's token balance from smart contract.
        
        Args:
            wallet_address: User's wallet address
        
        Returns:
            Balance in tokens (float), or None on error
        """
        if not self.contract:
            logger.error("[BlockchainBridge] Contract not initialized!")
            return None
        
        try:
            balance = self.contract.functions.balances(
                Web3.to_checksum_address(wallet_address)
            ).call()
            return float(balance) / 1e18  # Assuming 18 decimals
        except Exception as e:
            logger.error(f"[BlockchainBridge] Failed to get balance: {e}")
            return None
    
    def deduct_balance(self, wallet_address, amount_tokens, private_key):
        """
        Call smart contract function to deduct balance (consume tokens).
        
        Args:
            wallet_address: User's wallet address
            amount_tokens: Amount to deduct in tokens
            private_key: Sender's private key for transaction signing
        
        Returns:
            Transaction receipt dict, or None on error
        """
        if not self.contract:
            logger.error("[BlockchainBridge] Contract not initialized!")
            return None
        
        try:
            account = self.w3.eth.account.from_key(private_key)
            
            # Build transaction
            tx = self.contract.functions.deductBalance(
                Web3.to_checksum_address(wallet_address),
                int(amount_tokens * 1e18)
            ).build_transaction({
                'from': account.address,
                'nonce': self.w3.eth.get_transaction_count(account.address),
                'gas': 100000,
                'gasPrice': self.w3.eth.gas_price,
            })
            
            # Sign transaction
            signed_tx = self.w3.eth.account.sign_transaction(tx, private_key)
            
            # Send transaction
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            
            logger.info(f"[BlockchainBridge] Balance deduction sent: {tx_hash.hex()}")
            
            # Wait for receipt
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)
            
            return receipt
        
        except Exception as e:
            logger.error(f"[BlockchainBridge] Failed to deduct balance: {e}")
            return None
    
    def is_authorized(self, wallet_address):
        """
        Check if user's account is authorized on blockchain.
        
        Args:
            wallet_address: User's wallet address
        
        Returns:
            Boolean authorization status
        """
        if not self.contract:
            logger.error("[BlockchainBridge] Contract not initialized!")
            return False
        
        try:
            is_auth = self.contract.functions.isAuthorized(
                Web3.to_checksum_address(wallet_address)
            ).call()
            return bool(is_auth)
        except Exception as e:
            logger.error(f"[BlockchainBridge] Failed to check authorization: {e}")
            return False


# Global blockchain bridge instance
blockchain_bridge = BlockchainBridge()
