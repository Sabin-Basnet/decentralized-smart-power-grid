import numpy as np
import matplotlib.pyplot as plt

def short_biased_walk_with_counts(num_steps):
    # Initialize coordinate arrays
    x = np.zeros(num_steps)
    y = np.zeros(num_steps)
    
    # Initialize step counters
    forward_count = 0
    right_count = 0
    left_count = 0
    
    # Loop runs num_steps - 1 times (499 movements for 500 points)
    for i in range(1, num_steps):
        # Generate a random float between 0 and 100
        r = np.random.uniform(0, 100)
        
        # Apply the 50/20/30 probability constraints
        if 0 <= r < 50:      # 50% chance: Forward
            x[i] = x[i-1]
            y[i] = y[i-1] + 1
            forward_count += 1
        elif 50 <= r < 70:   # 20% chance: Right
            x[i] = x[i-1] + 1
            y[i] = y[i-1]
            right_count += 1
        else:                # 30% chance: Left
            x[i] = x[i-1] - 1
            y[i] = y[i-1]
            left_count += 1
            
    return x, y, forward_count, right_count, left_count

# Configuration
steps = 500
x_coords, y_coords, f_count, r_count, l_count = short_biased_walk_with_counts(steps)

# Terminal Output to verify probabilities
print(f"Total Movements: {steps - 1}")
print(f"Forward Steps (Expected ~250): {f_count}")
print(f"Left Steps    (Expected ~150): {l_count}")
print(f"Right Steps   (Expected ~100): {r_count}")

# Visualization
plt.figure(figsize=(8, 8))
plt.plot(x_coords, y_coords, color='darkorange', alpha=0.8, linewidth=1.5)
plt.scatter(x_coords[0], y_coords[0], color='green', s=100, label='Start (0,0)', zorder=5)
plt.scatter(x_coords[-1], y_coords[-1], color='red', s=100, label='End', zorder=5)

# Dynamically update title with the actual step counts
plt.title(f"Random Walk (500 Steps)\nFwd: {f_count} | Left: {l_count} | Right: {r_count}")
plt.xlabel("X Axis (Lateral Drift)")
plt.ylabel("Y Axis (Forward Progress)")
plt.legend()
plt.grid(True)
plt.show()