import { useEffect, useState } from 'react';

function localToday() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

export default function HabitForm({ habit, onSave, onClose }) {
  const [name, setName] = useState(habit?.name || '');
  const [description, setDescription] = useState(habit?.description || '');
  const [goalTarget, setGoalTarget] = useState(String(habit?.goal_target ?? 30));
  const [deadline, setDeadline] = useState(habit?.deadline || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape' && !busy) onClose();
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [busy, onClose]);

  async function handleSubmit(event) {
    event.preventDefault();
    const cleanName = name.trim();
    const target = Number(goalTarget);
    if (!cleanName) return setError('Give your habit a name before saving.');
    if (!Number.isInteger(target) || target < 1) return setError('Target check-ins must be a whole number greater than zero.');
    if (deadline && deadline < localToday()) return setError('Deadline must be today or a future date.');
    if (deadline) {
      const daysAvailable = (Date.parse(`${deadline}T00:00:00Z`) - Date.parse(`${localToday()}T00:00:00Z`)) / 86_400_000 + 1;
      const maxTarget = daysAvailable + (habit?.completed_check_ins || 0);
      if (target > maxTarget) {
        return setError(`This target needs ${target - (habit?.completed_check_ins || 0)} more check-ins, but only ${daysAvailable} days remain before the deadline. Remove the deadline or lower the target.`);
      }
    }

    setBusy(true);
    setError('');
    try {
      await onSave({
        name: cleanName,
        description: description.trim() || null,
        goal_target: target,
        deadline: deadline || null,
      }, habit?.id);
      onClose();
    } catch (saveError) {
      setError(saveError.message || 'Could not save this habit. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <section className="habit-modal" role="dialog" aria-modal="true" aria-labelledby="habit-form-title">
        <div className="modal-heading">
          <div><p className="eyebrow">ONE STEP AT A TIME</p><h2 id="habit-form-title">{habit ? 'Refine your habit' : 'Plant a new habit'}</h2></div>
          <button className="icon-button modal-close" type="button" aria-label="Close" onClick={onClose} disabled={busy}>×</button>
        </div>
        <p className="modal-intro">Keep it simple. You can always adjust your plan as you go.</p>
        <form className="habit-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="habit-name">Habit name <span>*</span></label>
          <input autoFocus id="habit-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} placeholder="e.g. Take a morning walk" />
          <label htmlFor="habit-description">A little more about it <span className="optional-label">Optional</span></label>
          <textarea id="habit-description" rows="3" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What does this habit mean to you?" />
          <div className="form-row">
            <div><label htmlFor="goal-target">Target check-ins</label><input id="goal-target" type="number" min="1" step="1" value={goalTarget} onChange={(event) => setGoalTarget(event.target.value)} /></div>
            <div><label htmlFor="habit-deadline">Deadline <span className="optional-label">Optional</span></label><input id="habit-deadline" type="date" min={localToday()} value={deadline} onChange={(event) => setDeadline(event.target.value)} /></div>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button className="button button-quiet" type="button" onClick={onClose} disabled={busy}>Cancel</button>
            <button className="button button-primary" type="submit" disabled={busy}>{busy ? <><span className="spinner" /> Saving…</> : habit ? 'Save changes' : 'Create habit'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
