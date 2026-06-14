import pandas as pd
import numpy as np
import datetime
import joblib
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error

# =====================================================================
# 1. DATA GENERATION PIPELINE (Parameters matched to Proposal Features)
# =====================================================================
print("Generating synthetic residential grid telemetry...")

# Seed for reproducibility
np.random.seed(42)

# Generate 30 days of 15-minute interval data (4 intervals/hour * 24 hours * 30 days)
start_date = datetime.datetime(2026, 6, 1)
intervals = 4 * 24 * 30  
timestamps = [start_date + datetime.timedelta(minutes=15 * i) for i in range(intervals)]

data = []
cumulative_energy = 0.0
current_balance = 100.0  # Starting token balance
tariff_rate = 0.12       # Tokens per kWh cost rate

# Tracking variables for rolling delta calculation
prev_load = 0.5

for ts in timestamps:
    hour = ts.hour
    
    # Simulate cyclical daily residential profiles (Hour_tod)
    if 18 <= hour <= 22:    # Evening Peak (appliances, cooking, lights)
        base_load = np.random.uniform(2.5, 4.0)
    elif 7 <= hour <= 9:    # Morning Peak (getting ready)
        base_load = np.random.uniform(1.5, 2.5)
    else:                   # Off-peak / Overnight baseline
        base_load = np.random.uniform(0.3, 0.7)
        
    # Add minor Gaussian noise to make data realistic
    load_curr = max(0.05, base_load + np.random.normal(0, 0.1))
    
    # Calculate delta load over the interval (Delta_load)
    delta_load = load_curr - prev_load
    prev_load = load_curr
    
    # Compute energy step increment (15 minutes = 0.25 hours)
    energy_delta = load_curr * 0.25
    cumulative_energy += energy_delta
    
    # Compute prepaid token deduction step
    current_balance -= (energy_delta * tariff_rate)
    
    # Simulate user manual recharges when tokens fall below low threshold
    if current_balance <= 5.0:
        current_balance += np.random.choice([50.0, 100.0, 150.0])
        
    # Standard profile is labeled as 0 (Normal)
    theft_label = 0 
    
    # Inject 1.5% probability of a physical anomaly (Bypassing the meter line)
    # This features a sharp collapse in load during high peak hours without balance empty
    if np.random.rand() < 0.015 and (18 <= hour <= 22):
        load_curr = np.random.uniform(0.05, 0.15)
        delta_load = -2.0  # Massive negative drop signature
        theft_label = 1    # Anomaly profile
        
    # Calculate target variable for Model 2: Minutes remaining until exhaustion
    # Minutes = (Current Balance / (Hourly Power Draw * Cost Per Hour)) * 60 minutes
    minutes_remaining = (current_balance / (max(0.1, load_curr) * tariff_rate)) * 60.0
    # Keep it tightly bounded to prevent infinite divisions
    minutes_remaining = min(10000.0, max(0.0, minutes_remaining))
    
    data.append([hour, load_curr, cumulative_energy, delta_load, current_balance, minutes_remaining, theft_label])

# Build dataframe using the exact engineering feature keys in your proposal
columns = ['Hour_tod', 'Load_curr', 'Energy_cum', 'Delta_load', 'Bal_token', 'Minutes_Remaining', 'Ground_Truth_Theft']
df = pd.DataFrame(data, columns=columns)
df.to_csv('meter_training_data.csv', index=False)
print(f"Dataframe compilation successful. Total samples saved: {len(df)}")


# =====================================================================
# 2. MODEL 2 TRAINING: PREDICTIVE BUDGETING (Supervised Linear Regression)
# =====================================================================
print("\nTraining Model 2: Predictive Budgeting Engine...")

# Select input features and target variable
X_budget = df[['Hour_tod', 'Load_curr', 'Bal_token']]
y_budget = df['Minutes_Remaining']

# Split into training and validation sets (80/20 split)
X_train_b, X_test_b, y_train_b, y_test_b = train_test_split(X_budget, y_budget, test_test_split=0.2, random_state=42)

# Instantiate and fit the model
budget_model = LinearRegression()
budget_model.fit(X_train_b, y_train_b)

# Evaluate predictions using Root Mean Squared Error (RMSE) as guaranteed by report metrics
predictions_b = budget_model.predict(X_test_b)
rmse = np.sqrt(mean_squared_error(y_test_b, predictions_b))
print(f"Budget Engine Training Complete. Validation RMSE: {rmse:.4f} Minutes")


# =====================================================================
# 3. MODEL 3 TRAINING: ANOMALY DETECTION (Unsupervised Isolation Forest)
# =====================================================================
print("\nTraining Model 3: Grid Anomaly Detector...")

# Unsupervised models train entirely on normal operational metrics without looking at labels
# Features used to identify structural clusters: Time, current draw, and sudden drop rate
X_anomaly = df[['Hour_tod', 'Load_curr', 'Delta_load']]

# Setup Isolation Forest
# contamination=0.015 means we estimate roughly 1.5% of our generated lines are outliers
anomaly_model = IsolationForest(contamination=0.015, random_state=42)
anomaly_model.fit(X_anomaly)

# Predict markers: 1 = normal, -1 = anomaly/outlier
df['Predicted_Marker'] = anomaly_model.predict(X_anomaly)

# Map our dataset evaluation labels (1 = theft) to match Isolation Forest returns (-1 = theft)
df['Mapped_Ground_Truth'] = df['Ground_Truth_Theft'].map({0: 1, 1: -1})

# Calculate precision metric matching report validation design
correct_detections = df[(df['Mapped_Ground_Truth'] == -1) & (df['Predicted_Marker'] == -1)]
total_predicted_anomalies = df[df['Predicted_Marker'] == -1]
precision = len(correct_detections) / len(total_predicted_anomalies) if len(total_predicted_anomalies) > 0 else 0
print(f"Anomaly Detection Training Complete. Mathematical Precision: {precision * 100:.2f}%")


# =====================================================================
# 4. EXPORT PIPELINE STORAGE
# =====================================================================
print("\nSerializing artifacts for production deployment...")
joblib.dump(budget_model, 'budget_model.pkl')
joblib.dump(anomaly_model, 'anomaly_model.pkl')
print("Saved artifacts successfully: 'budget_model.pkl' and 'anomaly_model.pkl'")