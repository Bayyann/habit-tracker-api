import { useState } from 'react';

function localToday() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function prettyDate(value) {
  if (!value) return 'No deadline';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    .format(new Date(`${value}T00:00:00`));
}

export default function HabitCard({ habit, checkIn, onEdit, onDelete, onCheckIn }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const checkedToday = checkIn?.day === localToday();
  const completedCheckIns = habit.completed_check_ins || 0;
  const progressPercent = habit.goal_target > 0
    ? Math.min((completedCheckIns / habit.goal_target) * 100, 100)
    : 0;

  async function handleCheckIn() {
    setBusy(true);
    setError('');
    try {
      await onCheckIn(habit.id);
    } catch (requestError) {
      setError(requestError.message || 'Could not check in. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete “${habit.name}”? This cannot be undone.`)) return;
    setError('');
    try {
      await onDelete(habit.id);
    } catch (requestError) {
      setError(requestError.message || 'Could not delete this habit.');
    }
  }

  return (
    <article className="habit-card">
      <div className="habit-card-top">
        <div className="habit-symbol" aria-hidden="true">✳</div>
        <div className="habit-actions">
          <button className="icon-button" type="button" aria-label={`Edit ${habit.name}`} onClick={() => onEdit(habit)} title="Edit habit">✎</button>
          <button className="icon-button delete-action" type="button" aria-label={`Delete ${habit.name}`} onClick={handleDelete} title="Delete habit">×</button>
        </div>
      </div>
      <h3>{habit.name}</h3>
      <p className={`habit-description${habit.description ? '' : ' muted'}`}>
        {habit.description || 'A small promise to yourself.'}
      </p>
      <div className="habit-meta">
        <div className="meta-item">
          <span className="meta-icon" aria-hidden="true">◎</span>
          <span><strong>{habit.goal_target}</strong> target check-ins</span>
        </div>
        <div className="meta-item">
          <span className="meta-icon deadline-icon" aria-hidden="true">⌁</span>
          <span>{prettyDate(habit.deadline)}</span>
        </div>
      </div>
      <div className="progress-note">
        <div className="progress-note-heading"><span>Progress</span><span>{completedCheckIns} of {habit.goal_target} check-ins</span></div>
        <div className="progress-track" role="progressbar" aria-label={`${habit.name} completion progress`} aria-valuemin="0" aria-valuemax={habit.goal_target} aria-valuenow={Math.min(completedCheckIns, habit.goal_target)}>
          <span style={{ width: `${progressPercent}%` }} />
        </div>
        <p>{completedCheckIns >= habit.goal_target ? 'Goal reached — wonderful work.' : `${habit.goal_target - completedCheckIns} check-in${habit.goal_target - completedCheckIns === 1 ? '' : 's'} to reach your goal.`}</p>
      </div>
      {checkIn && <div className="checkin-info" role="status"><span className="checkin-check">✓</span><span>Last check-in: {prettyDate(checkIn.day)}</span><span className="streak-pill">{checkIn.streak} day{checkIn.streak === 1 ? '' : 's'} streak</span></div>}
      {error && <p className="card-error" role="alert">{error}</p>}
      <button className={`button checkin-button${checkedToday ? ' checked' : ''}`} type="button" onClick={handleCheckIn} disabled={busy || checkedToday}>
        {busy ? <><span className="spinner spinner-dark" /> Saving check-in…</> : checkedToday ? <>✓ Checked in today</> : <>Mark today complete <span aria-hidden="true">→</span></>}
      </button>
    </article>
  );
}
