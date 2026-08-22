# Machine learning in the smart grid

The ML code lives in `backend/ml_engine.py`. The current implementation combines a learned consumption baseline with a transparent electrical anomaly rule. It is designed for this local prototype and runs in-process when the FastAPI backend starts.

## Models and methods

### 1. Linear regression for usage forecasting

The project initializes one shared `DharanRegressionModel` as `ML_MODEL`.

At startup it loads `data/dharan_meter_history.csv` and trains scikit-learn's `LinearRegression` when the file is available. The dataset contains these fields:

- `user_id` - meter identifier, such as `DHARAN-001`
- `timestamp` - reading time
- `line_current` and `neutral_current` - current measurements
- `power_consumed` - recorded consumption
- `remaining_tokens` - prepaid balance after the reading

The training features are:

```text
power_consumed, hour, day_of_week
```

The training target is:

```text
remaining_tokens / power_consumed
```

Rows with zero or invalid consumption are excluded from model fitting so the target cannot become infinite or undefined.

The model also calculates two values used by the runtime forecast:

- `baseline_rate` - the mean `power_consumed` across the training data
- `user_weights` - each meter's mean consumption divided by the shared baseline rate

For a meter with balance `B`, the current forecast uses:

```text
usage = recent_usage                 when a recent usage value is supplied
usage = baseline_rate * user_weight  otherwise
hours_remaining = max(0, B / max(usage, 0.001))
```

The result is rounded to one decimal place. Unknown meters use a default weight of `1.0`, and a zero or negative balance returns `0.0` hours.

> Implementation note: the fitted `LinearRegression` object is currently retained and trained, but `predict_hours_remaining()` uses the baseline rate and per-meter weight calculation rather than calling `LinearRegression.predict()`. This makes the current forecast a personalized baseline estimate, not a direct regression prediction from the time features.

### 2. Current-differential anomaly detection

`classify_current_differential()` calculates:

```text
differential = abs(line_current - neutral_current)
```

A reading is marked anomalous when the differential is greater than `0.2` amps. The method returns:

- `label`: `Normal` or `Theft Detected`
- `is_anomalous`: boolean flag
- `differential_amps`
- `threshold_amps`
- `severity`: `LOW` or `CRITICAL`

This is a deterministic threshold rule, not a trained ML classifier. The compatibility function `detect_load_drop()` delegates to the same rule for the final telemetry reading.

## How the backend uses the results

`backend/services.py` calls the anomaly rule and forecast for every accepted telemetry reading:

1. The telemetry schema reads `line_current` and `neutral_current`. If they are absent, line current falls back to `load` and neutral current falls back to `0.0`.
2. The backend computes the anomaly result and includes it in the response as `anomaly` and `theft_flag`.
3. The backend calculates `time_to_exhaustion` from the remaining prepaid balance and meter ID.
4. The result is returned alongside the blockchain balance and relay command.

`backend/main.py` also uses `ML_MODEL.predict_hours_remaining()` to provide `hours_remaining` for each user in `GET /api/v1/dashboard`.

The current service does not automatically call the smart contract anomaly-cutoff functions when the differential rule detects an anomaly. A hardware tamper signal still causes an immediate `DISCONNECT`, while a depleted blockchain balance causes `DISCONNECT` through the prepaid logic.

## Runtime flow

```text
CSV history
   -> pandas DataFrame
   -> LinearRegression fit + baseline and meter weights
   -> ML_MODEL singleton

telemetry
   -> current-differential rule
   -> anomaly/theft fields in API response
   -> remaining balance + meter usage baseline
   -> time_to_exhaustion in API response
```

## Dependencies

The backend ML implementation uses:

- `pandas` for loading and preparing meter history
- `numpy` for numeric operations and compatibility helpers
- `scikit-learn` for `LinearRegression`

They are listed in `requirements.txt` and installed with the backend dependencies described in `RUNNING.md`.

## Limitations and next steps

This is a prototype model rather than a production forecasting or theft-detection system. The training data is small and local, the regression prediction is not yet used by the forecast method, and the anomaly threshold is fixed. A production implementation would need validated historical data, train/test evaluation, model monitoring, calibrated thresholds, and a deliberate policy for connecting anomaly results to account authorization and relay control.
