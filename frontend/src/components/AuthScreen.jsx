import { useEffect, useState } from 'react';

export default function AuthScreen({ initialMode = 'login', onModeChange, onAuthenticate, busy, error }) {
  const [mode, setMode] = useState(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const isRegister = mode === 'register';

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    if (!username.trim() || !password) {
      setFormError('Enter both a username and password to continue.');
      return;
    }
    await onAuthenticate({ username: username.trim(), password }, isRegister);
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setFormError('');
    onModeChange?.(nextMode);
  }

  return (
    <main className="auth-layout">
      <section className="auth-story">
        <a className="brand" href="#home" aria-label="Daywell home">
          <span className="brand-mark">d</span><span>daywell</span>
        </a>
        <div className="story-copy">
          <p className="eyebrow">A little better, every day</p>
          <h1>Make room for the things that <em>matter.</em></h1>
          <p className="story-description">Small steps become meaningful change. Keep your routines close, and give your goals the space to grow.</p>
          <div className="quote-card">
            <span className="quote-icon">✳</span>
            <p>“You do not rise to the level of your goals. You fall to the level of your systems.”</p>
            <span className="quote-byline">A gentle reminder for the journey</span>
          </div>
        </div>
        <div className="story-footer"><span>Make today count.</span><span>01 — YOUR OWN PACE</span></div>
      </section>

      <section className="auth-panel">
        <div className="auth-topline"><span>YOUR PERSONAL HABIT SPACE</span><span className="online-dot" /> Made for real life</div>
        <div className="auth-card">
          <div className="mobile-brand brand"><span className="brand-mark">d</span><span>daywell</span></div>
          <p className="eyebrow">{isRegister ? 'A fresh start' : 'Welcome back'}</p>
          <h2>{isRegister ? 'Create your space' : 'Good to see you.'}</h2>
          <p className="auth-subtitle">{isRegister ? 'Start building a life that feels a little more like yours.' : 'Sign in and pick up where you left off.'}</p>

          <div className="auth-tabs" role="tablist" aria-label="Account access">
            <button className={isRegister ? '' : 'active'} type="button" role="tab" aria-selected={!isRegister} onClick={() => changeMode('login')}>Sign in</button>
            <button className={isRegister ? 'active' : ''} type="button" role="tab" aria-selected={isRegister} onClick={() => changeMode('register')}>Create account</button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <label htmlFor="username">Username</label>
            <input id="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Your username" maxLength={80} />
            <label htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" />
            {(formError || error) && <p className="form-error" role="alert">{formError || error}</p>}
            <button className="button button-primary auth-submit" disabled={busy} type="submit">
              {busy ? <><span className="spinner" /> Please wait…</> : <>{isRegister ? 'Create my account' : 'Sign in'} <span aria-hidden="true">→</span></>}
            </button>
          </form>
          <p className="auth-note">Your progress is personal. Your account is yours.</p>
        </div>
        <footer className="auth-footer">© {new Date().getFullYear()} Daywell <span>·</span> Small habits, softer days</footer>
      </section>
    </main>
  );
}
