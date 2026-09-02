from web3 import Web3
from app.shared.config import settings

CONTRACT_ABI = [
    {
        "inputs": [
            {"internalType": "string", "name": "evidenceId", "type": "string"},
            {"internalType": "bytes32", "name": "evidenceHash", "type": "bytes32"}
        ],
        "name": "registerEvidence",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "string", "name": "evidenceId", "type": "string"},
            {"internalType": "string", "name": "action", "type": "string"}
        ],
        "name": "recordAction",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "string", "name": "evidenceId", "type": "string"},
            {"internalType": "bytes32", "name": "currentHash", "type": "bytes32"}
        ],
        "name": "verifyEvidence",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    }
]

class BlockchainService:
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(settings.HARDHAT_RPC_URL))
        self.contract_address = settings.CONTRACT_ADDRESS
        
    def is_connected(self) -> bool:
        try:
            return self.w3.is_connected()
        except Exception:
            return False

    def _hash_to_bytes32(self, hex_hash: str) -> bytes:
        if hex_hash.startswith("0x"):
            hex_hash = hex_hash[2:]
        return bytes.fromhex(hex_hash)

    def register_evidence(self, evidence_id: str, sha256_hash: str) -> str:
        if not self.is_connected() or not self.contract_address:
            print("[SIMULATION] Hardhat node not reachable or contract address not set. Simulating blockchain tx.")
            return f"0xsimulated_tx_{evidence_id}_reg"
            
        contract = self.w3.eth.contract(address=self.contract_address, abi=CONTRACT_ABI)
        accounts = self.w3.eth.accounts
        if not accounts:
            return f"0xsimulated_tx_{evidence_id}_no_acc"
            
        hash_bytes = self._hash_to_bytes32(sha256_hash)
        tx_hash = contract.functions.registerEvidence(str(evidence_id), hash_bytes).transact({'from': accounts[0]})
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        return receipt.transactionHash.hex()

    def record_action(self, evidence_id: str, action: str) -> str:
        if not self.is_connected() or not self.contract_address:
            return f"0xsimulated_tx_{evidence_id}_{action}"
            
        contract = self.w3.eth.contract(address=self.contract_address, abi=CONTRACT_ABI)
        accounts = self.w3.eth.accounts
        if not accounts:
            return f"0xsimulated_tx_{evidence_id}_{action}"
            
        tx_hash = contract.functions.recordAction(str(evidence_id), action).transact({'from': accounts[0]})
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        return receipt.transactionHash.hex()

    def verify_evidence(self, evidence_id: str, current_sha256_hash: str) -> bool:
        if not self.is_connected() or not self.contract_address:
            return True
            
        contract = self.w3.eth.contract(address=self.contract_address, abi=CONTRACT_ABI)
        hash_bytes = self._hash_to_bytes32(current_sha256_hash)
        return contract.functions.verifyEvidence(str(evidence_id), hash_bytes).call()

blockchain_service = BlockchainService()
