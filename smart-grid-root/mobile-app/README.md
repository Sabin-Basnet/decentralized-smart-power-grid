# SmartGrid — Decentralized Prepaid Smart Power Grid

Mobile frontend for the minor project on a Decentralized Prepaid Smart Power Grid.
Built with React Native + Expo. Supports dual-user roles: **Client (Consumer)** and **Provider (Admin)**.

---

## Project Info

| Field | Detail |
|---|---|
| Institution | Tribhuvan University, IOE — Purwanchal Campus |
| Team | Pratima Chaudhary (064), Rabin Kattel (067), Sabin Basnet (077), Sarbesh Timsina (082) |
| Expo SDK | 54 |
| Target | Expo Go 54.0.8 (Android/iOS) |

---

## Features

### Client (Consumer)
- Real-time token balance with low/critical alerts
- Power relay status (Active / Inactive)
- Live usage metrics: load current (kW), cumulative energy (kWh)
- 24-hour SVG consumption chart
- ML Budget Countdown (Linear Regression forecast)
- Blockchain transaction ledger with hash verification
- Profile & meter device info

### Provider (Admin)
- Grid overview: consumers, active/inactive counts, revenue, energy dispatched
- Anomaly detection dashboard (Isolation Forest ML)
- Consumer search & detail view
- Reports with consumption trends and balance distribution
- Export report button (wired to backend in full implementation)

---

## Running on Your Phone with Expo Go

### Prerequisites

1. Install **Node.js 18+** — https://nodejs.org
2. Install **Expo Go 54.0.8** from the Google Play Store on your Android phone

### Step-by-Step

```bash
# 1. Clone / unzip the project, then enter the folder
cd smartgrid-app

# 2. Install dependencies
npm install

# 3. Start the Expo development server
npx expo start
```

4. After running `npx expo start`, a QR code appears in the terminal.
5. Open **Expo Go** on your phone.
6. Tap **"Scan QR Code"** in Expo Go and scan the QR code from the terminal.
7. The app loads on your phone automatically.

> **Important:** Your phone and laptop must be on the **same Wi-Fi network**.

### If Scanning Fails (Tunnel Mode)

```bash
npx expo start --tunnel
```

This creates a public tunnel URL — scan that QR code instead. Useful when on restricted networks or hotspots.

---

## Project Structure

```
smartgrid-app/
├── app/
│   ├── _layout.tsx              # Root layout (SafeAreaProvider, GestureHandler)
│   ├── index.tsx                # Landing screen — role selection
│   ├── (client)/
│   │   ├── _layout.tsx          # Client tab bar
│   │   ├── index.tsx            # Client dashboard
│   │   ├── consumption.tsx      # 24h usage analysis
│   │   ├── transactions.tsx     # Blockchain ledger
│   │   └── profile.tsx          # Profile & settings
│   └── (provider)/
│       ├── _layout.tsx          # Provider tab bar
│       ├── index.tsx            # Grid overview dashboard
│       ├── users.tsx            # Consumer management
│       ├── anomalies.tsx        # Anomaly detection alerts
│       └── reports.tsx          # Reports & analytics
│
├── components/
│   ├── shared/
│   │   ├── Header.tsx
│   │   ├── GradientButton.tsx
│   │   └── SectionTitle.tsx
│   ├── client/
│   │   ├── BalanceCard.tsx
│   │   ├── UsageMetrics.tsx
│   │   ├── ConsumptionChart.tsx
│   │   ├── BudgetCountdown.tsx
│   │   └── TransactionItem.tsx
│   └── provider/
│       ├── StatCard.tsx
│       ├── AnomalyItem.tsx
│       └── ConsumerRow.tsx
│
├── constants/
│   ├── colors.ts                # Design system color tokens
│   └── mockData.ts              # Simulated backend data
│
└── types/
    └── index.ts                 # TypeScript interfaces
```

---

## Connecting to Real Backend

When the FastAPI backend and Hardhat blockchain are running:

1. Create a `.env` file:
   ```
   EXPO_PUBLIC_API_URL=http://<your-machine-ip>:8000
   ```
2. Replace the mock data calls in each screen with `fetch(process.env.EXPO_PUBLIC_API_URL + '/...')`.
3. The `ConsumptionChart` component accepts live data arrays — feed it from the FastAPI `/telemetry` endpoint.
4. For wallet/blockchain reads, use Web3.py on the backend and expose the data via REST.

---

## Design Notes

- Dark theme optimized for utility/energy dashboards
- Color system: primary blue (#1F6FEB), accent teal (#00D4AA), danger red (#F85149)
- SVG line charts rendered with `react-native-svg` (no external chart library needed)
- All screens use `ScrollView` with pull-to-refresh support
- 8px grid spacing system throughout
