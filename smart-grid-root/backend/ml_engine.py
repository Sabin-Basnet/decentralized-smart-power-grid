"""
ml_engine.py - Machine Learning pipeline for anomaly detection and consumption forecasting
Implements Isolation Forest (unsupervised anomaly detection) and Linear Regression (hours remaining)
"""
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error
from sklearn.preprocessing import StandardScaler
from collections import deque
from datetime import datetime, timedelta
import json


def predict_time_to_exhaustion(load_data, available_energy=0.0):
    """Predict whole hours until the available energy is exhausted.

    Consecutive load observations form supervised training pairs: each load
    predicts the following load. The returned RMSE is the held-out validation
    error for callers that need to inspect model quality.
    """
    loads = np.asarray(load_data, dtype=float).reshape(-1)
    if loads.size == 0:
        return 0, 0.0
    if np.any(loads < 0) or not np.isfinite(loads).all():
        raise ValueError("load_data must contain finite, non-negative values")

    if loads.size < 3:
        predicted_load = float(np.mean(loads))
        rmse = 0.0
    else:
        features = loads[:-1].reshape(-1, 1)
        targets = loads[1:]
        split_index = max(1, int(len(features) * 0.8))
        model = LinearRegression().fit(features[:split_index], targets[:split_index])
        validation_predictions = model.predict(features[split_index:])
        validation_targets = targets[split_index:]
        rmse = float(
            np.sqrt(mean_squared_error(validation_targets, validation_predictions))
        ) if validation_targets.size else 0.0
        model.fit(features, targets)
        predicted_load = float(model.predict([[loads[-1]]])[0])
        predicted_load = max(predicted_load, 0.0)

    if available_energy <= 0 or predicted_load <= 0:
        return 0, rmse
    return int(available_energy / predicted_load), rmse


def detect_load_drop(telemetry, contamination=0.1):
    """Return whether the newest telemetry value is an Isolation Forest anomaly."""
    loads = np.asarray(telemetry, dtype=float).reshape(-1)
    if loads.size < 4:
        return False
    if np.any(loads < 0) or not np.isfinite(loads).all():
        raise ValueError("telemetry must contain finite, non-negative values")

    drops = np.diff(loads, prepend=loads[0])
    features = np.column_stack((loads, drops))
    model = IsolationForest(
        contamination=min(max(contamination, 0.01), 0.5),
        random_state=42,
        n_estimators=100,
    )
    model.fit(features[:-1])
    baseline_load = float(np.median(loads[:-1]))
    abrupt_drop = drops[-1] < 0 and loads[-1] < baseline_load * 0.5
    return bool(model.predict(features[-1:])[0] == -1 or abrupt_drop)

class MLPipeline:
    """
    Unified ML engine for Smart Grid anomaly detection and forecasting.
    """
    
    def __init__(self, contamination=0.05, window_size=100):
        """
        Initialize ML models.
        
        Args:
            contamination: Expected proportion of anomalies (default 5%)
            window_size: Number of recent records for regression analysis
        """
        self.contamination = contamination
        self.window_size = window_size
        
        # Isolation Forest for unsupervised anomaly detection
        self.isolation_forest = IsolationForest(
            contamination=contamination,
            random_state=42,
            n_estimators=100
        )
        
        # Linear Regression for consumption forecasting
        self.regression_model = LinearRegression()
        self.scaler = StandardScaler()
        
        # Buffers for training data
        self.consumption_buffer = deque(maxlen=window_size)
        self.timestamp_buffer = deque(maxlen=window_size)
        self.anomaly_scores_buffer = deque(maxlen=window_size)
        
        self.is_trained = False
    
    def add_telemetry(self, power_consumption_kw, load_percentage, timestamp=None):
        """
        Add new telemetry data to buffers for incremental learning.
        
        Args:
            power_consumption_kw: Power consumption in kilowatts
            load_percentage: Load as percentage (0-100)
            timestamp: datetime object (defaults to now)
        """
        if timestamp is None:
            timestamp = datetime.utcnow()
        
        self.consumption_buffer.append(power_consumption_kw)
        self.timestamp_buffer.append(timestamp)
        self.anomaly_scores_buffer.append(None)  # Will be filled by detect_anomaly
    
    def detect_anomaly(self, current_data):
        """
        Detect anomalies using Isolation Forest algorithm.
        
        Args:
            current_data: Dict with keys {'power_consumption_kw', 'load_percentage'}
        
        Returns:
            Dict with keys {
                'is_anomalous': bool,
                'anomaly_score': float (-1 to 1, -1 is anomalous),
                'severity': str ('LOW', 'MEDIUM', 'HIGH')
            }
        """
        # Prepare feature vector
        if len(self.consumption_buffer) < 10:
            # Not enough data for reliable anomaly detection
            return {
                'is_anomalous': False,
                'anomaly_score': 0.0,
                'severity': 'LOW'
            }
        
        # Convert buffers to numpy arrays
        consumptions = np.array(list(self.consumption_buffer)).reshape(-1, 1)
        
        # Train/update Isolation Forest with recent data
        try:
            self.isolation_forest.fit(consumptions)
            self.is_trained = True
        except Exception as e:
            print(f"[ML Engine] Isolation Forest training error: {e}")
            return {
                'is_anomalous': False,
                'anomaly_score': 0.0,
                'severity': 'LOW'
            }
        
        # Predict on current data
        current_consumption = np.array([[current_data['power_consumption_kw']]])
        prediction = self.isolation_forest.predict(current_consumption)[0]
        anomaly_score = self.isolation_forest.score_samples(current_consumption)[0]
        
        # Map prediction (-1 = anomaly, 1 = normal) to score (0 to 1)
        normalized_score = max(-1.0, min(1.0, -anomaly_score))  # Normalize to -1..1
        
        is_anomalous = prediction == -1
        
        # Determine severity based on deviation from recent average
        recent_avg = np.mean(consumptions)
        deviation = abs(current_data['power_consumption_kw'] - recent_avg) / (recent_avg + 1e-6)
        
        if deviation > 2.0:  # More than 200% deviation
            severity = 'HIGH'
        elif deviation > 1.0:  # More than 100% deviation
            severity = 'MEDIUM'
        else:
            severity = 'LOW'
        
        return {
            'is_anomalous': is_anomalous,
            'anomaly_score': float(normalized_score),
            'severity': severity
        }
    
    def calculate_hours_remaining(self, current_balance_tokens, consumption_rate_kw=None):
        """
        Calculate estimated hours of electricity remaining based on balance and consumption.
        
        Args:
            current_balance_tokens: Current prepaid balance
            consumption_rate_kw: Optional override for average consumption rate
        
        Returns:
            Hours remaining (float), or None if insufficient data
        """
        if len(self.consumption_buffer) < 5:
            return None
        
        # Calculate average consumption rate if not provided
        if consumption_rate_kw is None:
            consumption_rate_kw = np.mean(list(self.consumption_buffer))
        
        # Assume token-to-kWh conversion: 1 token = 1 kWh
        # This mapping should match your smart contract's billing logic
        kwh_remaining = current_balance_tokens
        
        if consumption_rate_kw <= 0:
            return float('inf')
        
        hours_remaining = kwh_remaining / consumption_rate_kw
        return float(hours_remaining)
    
    def forecast_consumption(self, hours_ahead=24):
        """
        Forecast power consumption for the next N hours using Linear Regression.
        
        Args:
            hours_ahead: Number of hours to forecast (default 24)
        
        Returns:
            List of predicted consumption values, or None if insufficient data
        """
        if len(self.consumption_buffer) < 10:
            return None
        
        try:
            # Prepare X (time in hours) and y (consumption)
            times = np.arange(len(self.consumption_buffer)).reshape(-1, 1)
            consumptions = np.array(list(self.consumption_buffer)).reshape(-1, 1)
            
            # Fit linear regression model
            self.regression_model.fit(times, consumptions)
            
            # Generate future time points
            last_time = times[-1, 0]
            future_times = np.arange(last_time + 1, last_time + hours_ahead + 1).reshape(-1, 1)
            
            # Predict
            forecast = self.regression_model.predict(future_times)
            
            # Ensure non-negative predictions
            forecast = np.maximum(forecast, 0).flatten()
            
            return forecast.tolist()
        
        except Exception as e:
            print(f"[ML Engine] Forecasting error: {e}")
            return None
    
    def get_statistics(self):
        """
        Return current statistics about the consumption buffer.
        
        Returns:
            Dict with statistical summary
        """
        if len(self.consumption_buffer) == 0:
            return {
                'samples': 0,
                'mean': 0.0,
                'std': 0.0,
                'min': 0.0,
                'max': 0.0
            }
        
        consumptions = np.array(list(self.consumption_buffer))
        
        return {
            'samples': len(self.consumption_buffer),
            'mean': float(np.mean(consumptions)),
            'std': float(np.std(consumptions)),
            'min': float(np.min(consumptions)),
            'max': float(np.max(consumptions))
        }


# Global ML Pipeline Instance
ml_pipeline = MLPipeline(contamination=0.05, window_size=100)
