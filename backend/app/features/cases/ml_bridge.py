import os
import sys
from typing import List, Dict, Any

# Add ml directory to sys.path
ml_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "ml"))
if ml_dir not in sys.path:
    sys.path.append(ml_dir)

try:
    from src.inference import run_inference
except ImportError:
    run_inference = None

def trigger_ml_analysis() -> List[Dict[str, Any]]:
    """
    Direct module bridge calling ML inference pipeline.
    Returns list of EntityResult JSON objects.
    """
    if run_inference is None:
        raise RuntimeError("ML inference package could not be imported.")
        
    print("[INFO] ML Bridge executing run_inference()...")
    results = run_inference()
    print(f"[INFO] ML Bridge received {len(results)} entity analysis results.")
    return results
