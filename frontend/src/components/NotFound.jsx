export default function NotFound({ onHome }) {
  return (
    <main className="not-found-page">
      <a className="brand not-found-brand" href="/" onClick={(event) => { event.preventDefault(); onHome(); }} aria-label="Daywell home">
        <span className="brand-mark">d</span><span>daywell</span>
      </a>
      <section className="not-found-card" aria-labelledby="not-found-title">
        <p className="eyebrow">A LITTLE OFF THE PATH</p>
        <p className="not-found-code" aria-hidden="true">404</p>
        <h1 id="not-found-title">This page doesn’t exist.</h1>
        <p className="not-found-copy">We couldn’t find that page. Let’s get you back to your habits.</p>
        <button className="button button-primary" type="button" onClick={onHome}>Back to Daywell <span aria-hidden="true">→</span></button>
      </section>
      <footer className="not-found-footer">Small habits, softer days</footer>
    </main>
  );
}
