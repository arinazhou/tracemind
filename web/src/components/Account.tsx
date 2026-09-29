import { useEffect, useState } from 'react'
import { CLOUD_ENABLED } from '../cloud/config'
import { deleteCloudData, takeMovedIn, useSync, useUser } from '../data/progress'

type Tab = 'signin' | 'signup'

/** Sidebar account box: sign in / out. Renders nothing until Firebase is configured. */
export function AccountBox() {
  const user = useUser()
  const sync = useSync()
  const [open, setOpen] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => { if (user) setOpen(false) }, [user])
  useEffect(() => {
    if (!user || sync !== 'synced') return // wait until the account has finished loading
    const n = takeMovedIn()
    if (n) setNotice(`Moved ${n} problem${n === 1 ? '' : 's'} from this browser into your account.`)
  }, [user, sync])

  if (!CLOUD_ENABLED) return null

  if (!user) {
    return (
      <>
        <button className="account-signin" onClick={() => setOpen(true)}>
          <b>Sign in</b> to save your progress on every device
        </button>
        {open && <AuthModal onClose={() => setOpen(false)} />}
      </>
    )
  }

  const label = user.name || user.email || 'Signed in'
  return (
    <div className="account">
      <div className="row" style={{ gap: 8 }}>
        {user.photo
          ? <img className="avatar" src={user.photo} alt="" referrerPolicy="no-referrer" />
          : <span className="avatar">{label[0]?.toUpperCase()}</span>}
        <span className="account-name" title={user.email ?? ''}>{label}</span>
      </div>
      {notice && <div className="account-notice">{notice}</div>}
      <div className="account-actions">
        <button onClick={async () => { const { signOut } = await import('../cloud/cloud'); await signOut() }}>Sign out</button>
        <span>·</span>
        <button onClick={async () => {
          if (!window.confirm('Delete all your records (done ✓, dates, notes, solutions) from your account? This cannot be undone.')) return
          await deleteCloudData()
          setNotice('Your records were deleted.')
        }}>Delete my data</button>
      </div>
    </div>
  )
}

function AuthModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setError(''); setInfo('')
    const cloud = await import('../cloud/cloud')
    try {
      await fn()
    } catch (e) {
      const msg = cloud.explainAuthError(e)
      if (msg) setError(msg)
    } finally {
      setBusy(false)
    }
  }

  const google = () => run(async () => { const c = await import('../cloud/cloud'); await c.signInWithGoogle() })
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    run(async () => {
      const c = await import('../cloud/cloud')
      if (tab === 'signin') await c.signInWithEmail(email.trim(), password)
      else await c.createAccount(email.trim(), password)
    })
  }
  const forgot = () => {
    if (!email.trim()) { setError('Type your email above first, then press "Forgot password?".'); return }
    run(async () => {
      const c = await import('../cloud/cloud')
      await c.resetPassword(email.trim())
      setInfo(`If an account exists for ${email.trim()}, a reset link is on its way. Check your inbox (and spam).`)
    })
  }

  return (
    <div className="search-backdrop" onMouseDown={onClose}>
      <div className="card auth-panel" role="dialog" aria-label="Sign in" onMouseDown={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}>
        <button className="auth-close" onClick={onClose} aria-label="Close">×</button>
        <h2>Sign in to Tracemind</h2>
        <p className="muted" style={{ margin: '4px 0 16px', fontSize: 14 }}>
          Your done ✓, dates, notes and solutions follow you to any device. Only you can see your records.
        </p>
        <button className="btn google-btn" onClick={google} disabled={busy}>
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" /><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" /></svg>
          Continue with Google
        </button>
        <div className="auth-or"><span>or use email</span></div>
        <div className="mode-switch" style={{ marginBottom: 12 }}>
          <button className={tab === 'signin' ? 'on' : ''} onClick={() => { setTab('signin'); setError('') }}>Sign in</button>
          <button className={tab === 'signup' ? 'on' : ''} onClick={() => { setTab('signup'); setError('') }}>Create account</button>
        </div>
        <form onSubmit={submit} className="auth-form">
          <input type="email" required autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" required minLength={6} autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
            placeholder={tab === 'signin' ? 'Password' : 'Password (at least 6 characters)'} value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="btn primary" type="submit" disabled={busy}>{busy ? 'One moment…' : tab === 'signin' ? 'Sign in' : 'Create account'}</button>
        </form>
        {tab === 'signin' && <button className="hint-btn" style={{ marginTop: 10 }} onClick={forgot}>Forgot password?</button>}
        {error && <div className="friendly-error">{error}</div>}
        {info && <div className="compare ok">{info}</div>}
        <p className="faint" style={{ fontSize: 12, margin: '14px 0 0' }}>
          Signing in moves any progress already saved in this browser into your account.
        </p>
      </div>
    </div>
  )
}
