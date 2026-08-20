import React, { useState } from 'react'
import { Eye, EyeOff, Zap, Loader2, UserRound, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { DEMO_ACCOUNTS, ROLES } from '../../config/constants'

export default function LoginPage() {
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function validate() {
    const next = {}
    if (!email.trim()) next.email = 'Email is required.'
    else if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Enter a valid email address.'
    if (!password) next.password = 'Password is required.'
    else if (password.length < 6) next.password = 'Password must be at least 6 characters.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    if (!validate()) return

    setSubmitting(true)
    try {
      const session = await login(email, password, remember)
      toast.success(`Welcome back, ${session.name.split(' ')[0]}.`)
      navigate(session.role === ROLES.PROVIDER ? '/provider' : '/client', { replace: true })
    } catch (err) {
      setFormError(err.message || 'Login failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function fillDemo(role) {
    const acc = DEMO_ACCOUNTS[role]
    setEmail(acc.email)
    setPassword(acc.password)
    setErrors({})
    setFormError('')
  }

  return (
    <div className="login">
      <div className="login__backdrop" aria-hidden="true">
        <div className="login__grid-lines" />
        <div className="login__glow" />
      </div>

      <div className="login__panel">
        <div className="login__brand">
          <div className="login__brand-mark">
            <Zap size={22} strokeWidth={2.4} />
          </div>
          <div>
            <div className="login__brand-name">Dharan Grid</div>
            <div className="login__brand-tag">Decentralized Smart Power Network</div>
          </div>
        </div>

        <h1 className="login__title">Sign in to your account</h1>
        <p className="login__subtitle">Access live consumption, token balance, and grid operations.</p>

        <form className="login__form" onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span className="field__label">Email or username</span>
            <input
              type="text"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={errors.email ? 'field__input field__input--error' : 'field__input'}
              placeholder="you@grid.local"
            />
            {errors.email && <span className="field__error">{errors.email}</span>}
          </label>

          <label className="field">
            <span className="field__label">Password</span>
            <div className="field__password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={errors.password ? 'field__input field__input--error' : 'field__input'}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="field__toggle-visibility"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && <span className="field__error">{errors.password}</span>}
          </label>

          <div className="login__row">
            <label className="checkbox">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              <span>Remember me</span>
            </label>
          </div>

          {formError && (
            <div className="login__form-error" role="alert">
              {formError}
            </div>
          )}

          <button type="submit" className="btn btn--primary btn--full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 size={16} className="spin" /> Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <div className="login__demo">
          <div className="login__demo-title">
            <ShieldCheck size={14} /> Demo accounts
          </div>
          <div className="login__demo-grid">
            <button type="button" className="demo-card" onClick={() => fillDemo(ROLES.CLIENT)}>
              <UserRound size={16} />
              <div>
                <div className="demo-card__role">Client</div>
                <div className="demo-card__email">client@grid.local</div>
              </div>
            </button>
            <button type="button" className="demo-card" onClick={() => fillDemo(ROLES.PROVIDER)}>
              <ShieldCheck size={16} />
              <div>
                <div className="demo-card__role">Provider</div>
                <div className="demo-card__email">provider@grid.local</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
