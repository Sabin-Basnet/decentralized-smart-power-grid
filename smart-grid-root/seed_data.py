"""Generate reproducible historical smart-meter data for the Dharan grid."""
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "data" / "dharan_meter_history.csv"


def generate_seed_data(days: int = 180, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    timestamps = pd.date_range("2026-01-01", periods=days * 24, freq="h", tz="Asia/Kathmandu")
    records = []
    profiles = {
        "DHARAN-001": {"weight": 1.15, "base": 1.35, "balance": 320.0},
        "DHARAN-002": {"weight": 0.82, "base": 0.95, "balance": 250.0},
    }
    for user_id, profile in profiles.items():
        balance = profile["balance"]
        for timestamp in timestamps:
            hour = timestamp.hour
            habit = 1.0 + (0.7 if 6 <= hour <= 9 else 0.0) + (0.95 if 18 <= hour <= 22 else 0.0)
            power = max(0.15, profile["base"] * habit * profile["weight"] + rng.normal(0, 0.12))
            line_current = power * 4.2 + rng.normal(0, 0.04)
            neutral_current = line_current - abs(rng.normal(0.015, 0.008))
            balance = max(0.0, balance - power)
            records.append({
                "user_id": user_id,
                "timestamp": timestamp,
                "line_current": round(line_current, 4),
                "neutral_current": round(neutral_current, 4),
                "power_consumed": round(power, 4),
                "remaining_tokens": round(balance, 4),
            })
    return pd.DataFrame(records)


if __name__ == "__main__":
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    frame = generate_seed_data()
    frame.to_csv(OUTPUT, index=False)
    print(f"Wrote {len(frame):,} Dharan readings to {OUTPUT}")