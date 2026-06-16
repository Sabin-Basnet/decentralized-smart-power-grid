

# seed for reproducibility
np.random.seed(42)  

# Generate 30 days of 15-minute interval data (4 intervals/hour * 24 hours * 30 days)
start_date = datetime.datetime(2025, 6, 1)
intervals = 4 * 24 * 30  
timestamps = [start_date + datetime.timedelta(minutes=15 * i) for i in range(intervals)]

data = []
cumulative_energy = 0.0    # meter reading
current_balance = np.random.uniform(300.0, 2000.0)  # Random starting balance
# tariff_rate = 0.12       # Tokens per kWh cost rate
# Tracking variables for rolling delta calculation
prev_load = np.random.uniform(0.3, 0.7)

def calculate_nea_tariff_rate(monthly_units):
    """
    Returns the per-unit price (NPR) based on the total units 
    consumed so far during the current billing cycle (month).
    """
    if monthly_units <= 20:
        return 4.00   # Base rate for 15A meter standard
    elif monthly_units <= 30:
        return 6.50
    elif monthly_units <= 50:
        return 8.00
    elif monthly_units <= 150:
        return 9.50
    elif monthly_units <= 250:
        return 9.50
    else:
        return 11.00

# Create a timeline over 30 days
for ts in timestamps:
    hour = ts.hour
    
    # 1. VACATION LOGIC FIX: Check if it's a new day, and randomly decide if the house is empty today
    # 5% chance the family is away on vacation, at work all day, or travelling
    if hour == 0 and ts.minute == 0:
        is_vacation_day = np.random.rand() < 0.05  # True or False for the whole day
    
    # 2. Determine base load based on house occupancy state
    if is_vacation_day:
        # Household is on vacation! No appliance peaks. Only idle background devices run.
        base_load = np.random.uniform(0.05, 0.12)  # Just the fridge or standby routers
    else:
        # Standard routine (Family is home)
        if 18 <= hour <= 22:    # Evening Peak
            base_load = np.random.uniform(2.5, 4.0)
        elif 7 <= hour <= 9:    # Morning Peak
            base_load = np.random.uniform(1.5, 2.5)
        else:                   # Off-peak baseline
            base_load = np.random.uniform(0.3, 0.7)
            

    load_curr = max(0.05, base_load + np.random.normal(0, 0.1))
    
    # 4. ANOMALY LOGIC UPGRADE: Only flag theft if it's a high-probability drop 
    # AND the family is actually supposed to be home!
    theft_label = 0 
    if not is_vacation_day and (18 <= hour <= 22) and (np.random.rand() < 0.01):
        load_curr = np.random.uniform(0.05, 0.15)  # Drop looks like theft because they ARE home
        theft_label = 1
    
    # Calculate delta load over the interval (Delta_load)
    delta_load = load_curr - prev_load
    prev_load = load_curr
    
    # Compute energy step increment (15 minutes = 0.25 hours)
    energy_delta = load_curr * 0.25
    cumulative_energy += energy_delta
    
    # Compute prepaid token deduction step
    current_balance -= (energy_delta * calculate_nea_tariff_rate(monthly_units=cumulative_energy))
    
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