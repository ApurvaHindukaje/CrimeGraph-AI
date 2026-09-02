import hashlib
import json
from typing import Any, Dict

def hash_file_bytes(file_bytes: bytes) -> str:
    """Computes SHA-256 hash of raw file bytes."""
    return hashlib.sha256(file_bytes).hexdigest()

def hash_structured_data(data: Dict[str, Any]) -> str:
    """
    Computes SHA-256 hash of structured JSON analysis result.
    Enforces canonicalized serialization (sort_keys=True, fixed separators)
    so semantically identical objects produce identical hashes.
    """
    canonical_json = json.dumps(data, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical_json.encode("utf-8")).hexdigest()
