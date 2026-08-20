"""Dharan smart-grid models: strict leakage classification and token forecasting."""
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

LEAKAGE_THRESHOLD_AMPS = 0.15
DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "dharan_meter_history.csv"


def classify_current_differential(line_current: float, neutral_current: float,
                                  threshold: float = LEAKAGE_THRESHOLD_AMPS) -> dict:
    """Flag theft when the mathematical current differential exceeds the threshold."""
    differential = abs(float(line_current) - float(neutral_current))
    detected = differential > threshold
    return {
        "label": "Theft Detected" if detected else "Normal",
        "is_anomalous": detected,
        "differential_amps": round(differential, 4),
        "threshold_amps": threshold,
        "severity": "CRITICAL" if detected else "LOW",
    }


def detect_load_drop(telemetry, contamination=0.1):
    """Backward-compatible alias for callers that pass line/neutral pairs."""
    values = list(telemetry)
    if not values or not isinstance(values[0], dict):
        return False
    reading = values[-1]
    return classify_current_differential(
        reading["line_current"], reading["neutral_current"]
    )["is_anomalous"]


class DharanRegressionModel:
    """Shared usage baseline with a learned per-meter personalization weight."""

    def __init__(self, data_path=DATA_PATH):
        path = Path(data_path)
        self.data = pd.read_csv(path, parse_dates=["timestamp"]) if path.exists() else pd.DataFrame()
        self.model = LinearRegression()
        self.user_weights = {}
        self.baseline_rate = 1.0
        if not self.data.empty:
            self.fit(self.data)

    def fit(self, frame: pd.DataFrame):
        required = {"user_id", "timestamp", "power_consumed", "remaining_tokens"}
        missing = required - set(frame.columns)
        if missing:
            raise ValueError(f"Missing seed columns: {sorted(missing)}")
        frame = frame.copy()
        frame["hour"] = frame["timestamp"].dt.hour
        frame["day_of_week"] = frame["timestamp"].dt.dayofweek
        features = frame[["power_consumed", "hour", "day_of_week"]]
        target = frame["remaining_tokens"] / frame["power_consumed"].replace(0, np.nan)
        valid = target.replace([np.inf, -np.inf], np.nan).dropna().index
        self.model.fit(features.loc[valid], target.loc[valid])
        self.baseline_rate = float(frame["power_consumed"].mean())
        self.user_weights = frame.groupby("user_id")["power_consumed"].mean().div(self.baseline_rate).to_dict()

    def predict_hours_remaining(self, user_id: str, remaining_tokens: float, recent_usage=None) -> float:
        if remaining_tokens <= 0:
            return 0.0
        weight = float(self.user_weights.get(user_id, 1.0))
        usage = float(recent_usage if recent_usage is not None else self.baseline_rate * weight)
        return round(max(0.0, float(remaining_tokens) / max(usage, 0.001)), 1)


def predict_time_to_exhaustion(load_data, available_energy=0.0):
    """Compatibility helper for callers using the old API."""
    loads = np.asarray(load_data, dtype=float).reshape(-1)
    rate = float(np.mean(loads)) if loads.size else 0.0
    return (int(available_energy / rate) if rate > 0 and available_energy > 0 else 0, 0.0)


ML_MODEL = DharanRegressionModel()


class MLPipeline:
    def __init__(self, *_, **__):
        self.model = ML_MODEL

    def calculate_hours_remaining(self, current_balance_tokens, consumption_rate_kw=None, user_id="DHARAN-001"):
        return self.model.predict_hours_remaining(user_id, current_balance_tokens, consumption_rate_kw)
