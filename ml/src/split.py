import torch

def get_temporal_split(data, train_steps=(1, 34), val_steps=(35, 39), test_steps=(40, 49)):
    """
    Creates transductive temporal masks for train, val, and test sets.
    Prevents data leakage by ensuring chronological split.
    Loss and metrics are evaluated only on labeled nodes (y != -1).
    """
    time_steps = data.time_step
    labeled_mask = (data.y != -1)
    
    train_mask = (time_steps >= train_steps[0]) & (time_steps <= train_steps[1]) & labeled_mask
    val_mask = (time_steps >= val_steps[0]) & (time_steps <= val_steps[1]) & labeled_mask
    test_mask = (time_steps >= test_steps[0]) & (time_steps <= test_steps[1]) & labeled_mask
    
    print(f"[INFO] Temporal split created:")
    print(f"       Train (steps {train_steps[0]}-{train_steps[1]}): {train_mask.sum().item()} labeled nodes")
    print(f"       Val   (steps {val_steps[0]}-{val_steps[1]}): {val_mask.sum().item()} labeled nodes")
    print(f"       Test  (steps {test_steps[0]}-{test_steps[1]}): {test_mask.sum().item()} labeled nodes")
    
    return train_mask, val_mask, test_mask
