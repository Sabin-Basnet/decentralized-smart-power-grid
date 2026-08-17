import { useMemo, useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import './App.css'

const ESEWA_CONFIG = {
  phone: '+977 9824566009',
  name: 'Smart Grid Support',
  qrValue: 'esewa://payment?mobile=9824566009',
}

const accounts = [
  {
    id: 'C-1001',
    name: 'Aarav Shrestha',
    email: 'aarav@grid.local',
    role: 'client',
    location: 'Kathmandu',
    zone: 'Central',
    status: 'Active',
    balance: 2450,
    due: 890,
    meterId: 'NEA-KTM-001',
    usage: [42, 48, 49, 51, 45, 58, 62],
    bills: [
      { month: 'January', amount: 780, paid: true },
      { month: 'February', amount: 860, paid: true },
      { month: 'March', amount: 890, paid: false },
    ],
    history: [
      { date: '2026-08-01', kwh: 15.4, bill: 550 },
      { date: '2026-08-05', kwh: 18.1, bill: 640 },
      { date: '2026-08-10', kwh: 16.8, bill: 610 },
      { date: '2026-08-15', kwh: 20.2, bill: 715 },
    ],
    paymentMethods: ['eSewa', 'IME Pay', 'Bank card'],
  },
  {
    id: 'C-1002',
    name: 'Sita Poudel',
    email: 'sita@grid.local',
    role: 'client',
    location: 'Pokhara',
    zone: 'Western',
    status: 'Low balance',
    balance: 420,
    due: 640,
    meterId: 'NEA-PKR-014',
    usage: [31, 36, 34, 38, 40, 39, 43],
    bills: [
      { month: 'January', amount: 620, paid: true },
      { month: 'February', amount: 640, paid: false },
      { month: 'March', amount: 610, paid: false },
    ],
    history: [
      { date: '2026-08-02', kwh: 13.4, bill: 490 },
      { date: '2026-08-07', kwh: 15.1, bill: 540 },
      { date: '2026-08-12', kwh: 14.8, bill: 520 },
      { date: '2026-08-17', kwh: 17.3, bill: 610 },
    ],
    paymentMethods: ['Bank transfer', 'Khalti', 'Cash'],
  },
  {
    id: 'C-1003',
    name: 'Rabin K.C.',
    email: 'rabin@grid.local',
    role: 'client',
    location: 'Biratnagar',
    zone: 'Eastern',
    status: 'Active',
    balance: 1780,
    due: 510,
    meterId: 'NEA-BRT-022',
    usage: [27, 29, 33, 35, 32, 36, 40],
    bills: [
      { month: 'January', amount: 540, paid: true },
      { month: 'February', amount: 570, paid: true },
      { month: 'March', amount: 510, paid: false },
    ],
    history: [
      { date: '2026-08-03', kwh: 12.3, bill: 430 },
      { date: '2026-08-09', kwh: 14.5, bill: 490 },
      { date: '2026-08-13', kwh: 13.9, bill: 470 },
      { date: '2026-08-18', kwh: 16.2, bill: 510 },
    ],
    paymentMethods: ['eSewa', 'CARD', 'Wallet'],
  },
]

const demoUsers = {
  client: { email: 'client@grid.local', password: 'client123', accountId: 'C-1001' },
  provider: { email: 'provider@grid.local', password: 'provider123', accountId: 'P-01' },
}

const defaultForm = {
  device_id: 'NEA-KTM-001',
  load: '2.5',
  energy: '1.0',
  is_tampered: '0',
}

function App() {
  const [auth, setAuth] = useState({ loggedIn: false, role: null, email: '' })
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [selectedTab, setSelectedTab] = useState('overview')
  const [filters, setFilters] = useState({ search: '', status: 'all', zone: 'all' })
  const [form, setForm] = useState(defaultForm)
  const [response, setResponse] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null)
  const qrCanvasRef = useRef(null)

  // Generate QR code when payment method changes to eSewa
  useEffect(() => {
    if (selectedPaymentMethod === 'eSewa' && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, ESEWA_CONFIG.qrValue, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      }).catch((err) => console.error('QR Code generation error:', err))
    }
  }, [selectedPaymentMethod])

  const currentAccount = accounts.find((account) => account.id === demoUsers.client.accountId) || accounts[0]

  const filteredClients = useMemo(() => {
    return accounts.filter((account) => {
      const searchMatch = `${account.name} ${account.location} ${account.meterId}`
        .toLowerCase()
        .includes(filters.search.toLowerCase())
      const statusMatch = filters.status === 'all' || account.status === filters.status
      const zoneMatch = filters.zone === 'all' || account.zone === filters.zone
      return searchMatch && statusMatch && zoneMatch
    })
  }, [filters])

  const handleLogin = (event) => {
    event.preventDefault()

    const matchedRole = Object.entries(demoUsers).find(
      ([, value]) => value.email === loginForm.email && value.password === loginForm.password,
    )

    if (!matchedRole) {
      setError('Invalid email or password. Try client@grid.local / client123 or provider@grid.local / provider123')
      return
    }

    const [role] = matchedRole
    setAuth({ loggedIn: true, role, email: loginForm.email })
    setError('')
    setSelectedTab('overview')
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleTelemetrySubmit = async (event) => {
    event.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const payload = {
        device_id: form.device_id,
        load: Number(form.load),
        energy: Number(form.energy),
        is_tampered: Number(form.is_tampered),
      }

      const result = await fetch('http://127.0.0.1:8000/api/v1/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await result.json()

      if (!result.ok) {
        throw new Error(data?.detail || 'Telemetry update failed')
      }

      setResponse(data)
    } catch (submitError) {
      setError(submitError.message || 'Unable to reach the backend API.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayBill = () => {
    setPaymentSuccess(true)
    setTimeout(() => setPaymentSuccess(false), 2800)
  }

  if (!auth.loggedIn) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-header">
            <div className="brand-mark">SG</div>
            <div>
              <p className="eyebrow">Smart grid</p>
              <h1>Prepaid Power Portal</h1>
            </div>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <label>
              Email
              <input
                type="email"
                value={loginForm.email}
                onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="client@grid.local"
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="••••••••"
              />
            </label>

            <div className="demo-box">
              <strong>Demo credentials</strong>
              <span>Client: client@grid.local / client123</span>
              <span>Provider: provider@grid.local / provider123</span>
            </div>

            {error && <div className="message error">{error}</div>}

            <button type="submit">Login</button>
          </form>
        </div>
      </div>
    )
  }

  if (auth.role === 'provider') {
    return (
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand-block">
            <div className="brand-mark">SG</div>
            <div>
              <p className="eyebrow">Provider panel</p>
              <h2>GridOps</h2>
            </div>
          </div>

          <div className="profile-card">
            <span>Logged in</span>
            <strong>{auth.email}</strong>
          </div>

          <button className="logout-btn" type="button" onClick={() => setAuth({ loggedIn: false, role: null, email: '' })}>
            Log out
          </button>
        </aside>

        <main className="main-panel provider-panel">
          <header className="topbar">
            <div>
              <p className="eyebrow">Operations overview</p>
              <h1>Provider dashboard</h1>
            </div>
            <div className="status-pill safe">Network healthy</div>
          </header>

          <section className="filters-panel panel">
            <div className="panel-header">
              <h3>Filter users</h3>
              <span className="panel-chip">Consumer list</span>
            </div>

            <div className="filter-row">
              <input
                type="text"
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                placeholder="Search by name, meter, or location"
              />
              <select
                value={filters.status}
                onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
              >
                <option value="all">All statuses</option>
                <option value="Active">Active</option>
                <option value="Low balance">Low balance</option>
              </select>
              <select
                value={filters.zone}
                onChange={(event) => setFilters((current) => ({ ...current, zone: event.target.value }))}
              >
                <option value="all">All zones</option>
                <option value="Central">Central</option>
                <option value="Western">Western</option>
                <option value="Eastern">Eastern</option>
              </select>
            </div>
          </section>

          <section className="provider-grid">
            <div className="panel">
              <div className="panel-header">
                <h3>Active accounts</h3>
                <span className="panel-chip">{filteredClients.length} users</span>
              </div>

              <div className="user-list">
                {filteredClients.map((account) => (
                  <button type="button" key={account.id} className="user-card" onClick={() => setSelectedTab(account.id)}>
                    <div className="user-card-top">
                      <strong>{account.name}</strong>
                      <span className={account.status === 'Active' ? 'tag green' : 'tag amber'}>{account.status}</span>
                    </div>
                    <small>{account.location} • {account.zone}</small>
                    <div className="user-card-meta">
                      <span>{account.meterId}</span>
                      <span>{account.balance} NPR balance</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <h3>Selected user details</h3>
                <span className="panel-chip">Usage</span>
              </div>

              {filteredClients[0] ? (
                <>
                  <div className="detail-header">
                    <div>
                      <p className="eyebrow">Meter</p>
                      <strong>{filteredClients[0].meterId}</strong>
                    </div>
                    <div>
                      <p className="eyebrow">Location</p>
                      <strong>{filteredClients[0].location}</strong>
                    </div>
                  </div>

                  <div className="mini-chart">
                    {filteredClients[0].usage.map((value, index) => (
                      <div key={index} className="bar-wrap">
                        <div className="bar" style={{ height: `${value}%` }} />
                        <span>{index + 1}</span>
                      </div>
                    ))}
                  </div>

                  <div className="usage-summary">
                    <div>
                      <span>Current bill</span>
                      <strong>{filteredClients[0].due} NPR</strong>
                    </div>
                    <div>
                      <span>Last payment</span>
                      <strong>12 days ago</strong>
                    </div>
                  </div>
                </>
              ) : (
                <p>No consumers match your filters.</p>
              )}
            </div>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">SG</div>
          <div>
            <p className="eyebrow">Client portal</p>
            <h2>MyEnergy</h2>
          </div>
        </div>

        <nav className="nav-panel">
          <button type="button" className={selectedTab === 'overview' ? 'nav-btn active' : 'nav-btn'} onClick={() => setSelectedTab('overview')}>
            Overview
          </button>
          <button type="button" className={selectedTab === 'usage' ? 'nav-btn active' : 'nav-btn'} onClick={() => setSelectedTab('usage')}>
            Usage history
          </button>
          <button type="button" className={selectedTab === 'billing' ? 'nav-btn active' : 'nav-btn'} onClick={() => setSelectedTab('billing')}>
            Billing
          </button>
        </nav>

        <div className="profile-card">
          <span>Customer</span>
          <strong>{currentAccount.name}</strong>
          <small>{currentAccount.location}</small>
        </div>

        <button className="logout-btn" type="button" onClick={() => setAuth({ loggedIn: false, role: null, email: '' })}>
          Log out
        </button>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Welcome back</p>
            <h1>{currentAccount.name}</h1>
          </div>
          <div className="status-pill safe">{currentAccount.status}</div>
        </header>

        <section className="kpi-grid">
          <article className="metric-card">
            <span>Current balance</span>
            <strong>{currentAccount.balance} NPR</strong>
            <small>Prepaid wallet</small>
          </article>
          <article className="metric-card">
            <span>Outstanding bill</span>
            <strong>{currentAccount.due} NPR</strong>
            <small>Current cycle</small>
          </article>
          <article className="metric-card">
            <span>Meter</span>
            <strong>{currentAccount.meterId}</strong>
            <small>Smart meter</small>
          </article>
          <article className="metric-card">
            <span>Zone</span>
            <strong>{currentAccount.zone}</strong>
            <small>Service area</small>
          </article>
        </section>

        {selectedTab === 'overview' && (
          <section className="content-grid">
            <div className="panel">
              <div className="panel-header">
                <h3>Usage overview</h3>
                <span className="panel-chip">7-day</span>
              </div>

              <div className="mini-chart large">
                {currentAccount.usage.map((value, index) => (
                  <div key={index} className="bar-wrap">
                    <div className="bar" style={{ height: `${value}%` }} />
                    <span>{index + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <h3>Bill summary</h3>
                <span className="panel-chip">Due now</span>
              </div>

              <div className="bill-box">
                <strong>{currentAccount.due} NPR</strong>
                <span>Due on 28 Aug 2026</span>
                <button type="button" className="pay-btn" onClick={handlePayBill}>Pay bill</button>
                {paymentSuccess && <small className="success-text">Payment successful</small>}
              </div>
            </div>
          </section>
        )}

        {selectedTab === 'usage' && (
          <section className="panel">
            <div className="panel-header">
              <h3>Usage history</h3>
              <span className="panel-chip">Past reads</span>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Usage (kWh)</th>
                  <th>Bill (NPR)</th>
                </tr>
              </thead>
              <tbody>
                {currentAccount.history.map((entry) => (
                  <tr key={entry.date}>
                    <td>{entry.date}</td>
                    <td>{entry.kwh}</td>
                    <td>{entry.bill}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {selectedTab === 'billing' && (
          <section className="content-grid">
            <div className="panel">
              <div className="panel-header">
                <h3>Payment methods</h3>
                <span className="panel-chip">Secure</span>
              </div>

              <div className="payment-list">
                {currentAccount.paymentMethods.map((method) => (
                  <button
                    type="button"
                    key={method}
                    className={`payment-chip ${selectedPaymentMethod === method ? 'active' : ''}`}
                    onClick={() => setSelectedPaymentMethod(method)}
                  >
                    {method}
                  </button>
                ))}
              </div>

              {selectedPaymentMethod === 'eSewa' ? (
                <div className="esewa-payment">
                  <div className="esewa-header">
                    <h4>Pay via eSewa</h4>
                    <p>Quick and secure digital payment</p>
                  </div>
                  <div className="esewa-content">
                    <div className="qr-section">
                      <canvas ref={qrCanvasRef} />
                      <p className="qr-label">Scan to pay</p>
                    </div>
                    <div className="esewa-details">
                      <div className="detail-row">
                        <span>Payment to</span>
                        <strong>{ESEWA_CONFIG.name}</strong>
                      </div>
                      <div className="detail-row">
                        <span>Phone number</span>
                        <strong>{ESEWA_CONFIG.phone}</strong>
                      </div>
                      <div className="detail-row highlight">
                        <span>Amount</span>
                        <strong>{currentAccount.due} NPR</strong>
                      </div>
                      <p className="esewa-instruction">
                        • Open eSewa app on your phone<br/>
                        • Scan the QR code or enter the phone number above<br/>
                        • Enter amount: {currentAccount.due} NPR<br/>
                        • Confirm payment<br/>
                        • You'll receive a confirmation code
                      </p>
                    </div>
                  </div>
                  <button type="button" className="pay-btn esewa-confirm" onClick={handlePayBill}>
                    Confirm payment received
                  </button>
                </div>
              ) : (
                <div className="payment-form">
                  <label>
                    Cardholder name
                    <input type="text" placeholder="Aarav Shrestha" />
                  </label>
                  <label>
                    Card number
                    <input type="text" placeholder="1234 5678 9012 3456" />
                  </label>
                  <div className="split-row">
                    <label>
                      Expiry
                      <input type="text" placeholder="08/29" />
                    </label>
                    <label>
                      CVV
                      <input type="text" placeholder="123" />
                    </label>
                  </div>
                  <button type="button" className="pay-btn" onClick={handlePayBill}>
                    Complete payment
                  </button>
                </div>
              )}
            </div>

            <div className="panel">
              <div className="panel-header">
                <h3>Past bills</h3>
                <span className="panel-chip">History</span>
              </div>

              <div className="bill-list">
                {currentAccount.bills.map((bill) => (
                  <div key={bill.month} className="bill-item">
                    <div>
                      <strong>{bill.month}</strong>
                      <small>{bill.paid ? 'Paid' : 'Pending'}</small>
                    </div>
                    <span>{bill.amount} NPR</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
