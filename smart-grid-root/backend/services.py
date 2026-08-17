import json
import math
import os
from pathlib import Path

from eth_account import Account
from fastapi import HTTPException
from web3 import Web3

from backend.database import append_meter_data, get_info_by_account_id, update_account
from backend.schemas import MeterHistoryInput

Account.enable_unaudited_hdwallet_features()

ROOT_DIR = Path(__file__).resolve().parent.parent
BLOCKCHAIN_DIR = ROOT_DIR / "blockchain"
DEPLOYMENT_PATH = BLOCKCHAIN_DIR / "deployment.json"
ABI_PATH = BLOCKCHAIN_DIR / "contract-abi.json"


def _get_contract():
    deployment = DEPLOYMENT_PATH.read_text(encoding="utf-8") if DEPLOYMENT_PATH.exists() else "{}"
    if not DEPLOYMENT_PATH.exists() or not ABI_PATH.exists():
        raise HTTPException(status_code=503, detail="Blockchain contract has not been deployed yet.")

    deployment_info = json.loads(deployment)
    address = deployment_info.get("contractAddress")
    if not address:
        raise HTTPException(status_code=503, detail="Missing deployed contract address.")

    abi = json.loads(ABI_PATH.read_text(encoding="utf-8"))
    provider = Web3(Web3.HTTPProvider(os.getenv("BLOCKCHAIN_URL", "http://127.0.0.1:8545")))
    if not provider.is_connected():
        raise HTTPException(status_code=503, detail="Unable to connect to the local Hardhat node.")

    contract = provider.eth.contract(address=address, abi=abi)
    return provider, contract


def _meter_wallet(device_id: str) -> str:
    digest = Web3.keccak(text=device_id)
    address = "0x" + digest[-20:].hex()[2:]
    return Web3.to_checksum_address(address)


def _owner_account():
    mnemonic = os.getenv(
        "HARDHAT_MNEMONIC",
        "test test test test test test test test test test test junk",
    )
    account = Account.from_mnemonic(mnemonic, account_path="m/44'/60'/0'/0/0")
    return account


def _ensure_meter_funded(contract, wallet_address: str) -> None:
    balance = contract.functions.getBalance(wallet_address).call()
    if balance > 0:
        return

    owner = _owner_account()
    tx_hash = contract.functions.fundAccount(wallet_address, 100).transact({
        "from": owner.address,
        "gas": 200000,
    })
    contract.w3.eth.wait_for_transaction_receipt(tx_hash)


def _deduct_blockchain_energy(device_id: str, energy: float) -> dict:
    provider, contract = _get_contract()
    wallet = _meter_wallet(device_id)
    _ensure_meter_funded(contract, wallet)

    deduction = max(1, int(math.ceil(energy)))
    current_balance = contract.functions.getBalance(wallet).call()
    if current_balance <= 0:
        return {"remaining_balance": 0, "isolate_circuit": True}

    deduction = min(deduction, current_balance)
    owner = _owner_account()
    tx_hash = contract.functions.deductForConsumption(wallet, deduction).transact({
        "from": owner.address,
        "gas": 200000,
    })
    provider.eth.wait_for_transaction_receipt(tx_hash)

    remaining_balance = contract.functions.getBalance(wallet).call()
    return {
        "remaining_balance": float(remaining_balance),
        "isolate_circuit": contract.functions.isBalanceZero(wallet).call(),
    }


def handle_smart_meter_telemetry(data: MeterHistoryInput) -> dict:
    """Validate telemetry, deduct tokens from the blockchain, and update the local database."""
    meter_id = data.meter_id
    if not meter_id:
        raise HTTPException(status_code=400, detail="Device ID is required.")

    account = get_info_by_account_id(meter_id)
    if not account:
        raise HTTPException(status_code=404, detail="Smart Meter ID unregistered.")

    token_balance, monthly_units, current_status = account
    if data.is_tampered:
        update_account(meter_id, token_balance, monthly_units, "TAMPER_DETECTED")
        append_meter_data(meter_id, data.load, 0.0, abs(data.load), 1)
        return {
            "device_id": meter_id,
            "command": "DISCONNECT",
            "reason": "Hardware tamper detected",
            "remaining_balance": float(token_balance),
            "isolate_circuit": True,
        }

    deduction_result = _deduct_blockchain_energy(meter_id, data.energy)
    remaining_balance = deduction_result["remaining_balance"]
    isolate_circuit = deduction_result["isolate_circuit"]
    updated_units = monthly_units + float(data.energy)

    if isolate_circuit:
        update_account(meter_id, remaining_balance, updated_units, "OUT_OF_CREDIT")
        append_meter_data(meter_id, data.load, 0.0, abs(data.load), 0)
        return {
            "device_id": meter_id,
            "command": "DISCONNECT",
            "reason": "Prepaid balance depleted",
            "remaining_balance": remaining_balance,
            "isolate_circuit": True,
        }

    update_account(meter_id, remaining_balance, updated_units, current_status)
    append_meter_data(meter_id, data.load, 0.0, abs(data.load), 0)
    return {
        "device_id": meter_id,
        "command": "KEEP_ALIVE",
        "reason": "All systems normal",
        "remaining_balance": remaining_balance,
        "isolate_circuit": False,
    }