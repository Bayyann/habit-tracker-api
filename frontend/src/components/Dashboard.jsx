import { useState } from 'react';
import HabitCard from './HabitCard.jsx';
import HabitForm from './HabitForm.jsx';

function dateLabel() {
  return new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
}

function initials(username) {
  return username?.trim().slice(0, 1).toUpperCase() || 'Y';
}

function LoadingDashboard() {
  return (
    <main className="dashboard-shell">
      <header className="topbar"><div className="brand"><span className="brand-mark">d</span><span>daywell</span></div><div className="loading-chip"><span className="spinner spinner-dark" /> Gathering your space</div></header>
      <div className="dashboard-content"><div className="skeleton skeleton-title" /><div className="skeleton skeleton-subtitle" /><div className="habit-grid">{[1, 2, 3].map((item) => <div className="skeleton-card" key={item}><div className="skeleton skeleton-icon" /><div className="skeleton skeleton-heading" /><div className="skeleton skeleton-line" /><div className="skeleton skeleton-button" /></div>)}</div></div>
    </main>
  );
}

export default function Dashboard({ user, habits, checkIns, loading, error, onLogout, onSaveHabit, onDeleteHabit, onCheckIn }) {
  const [editingHabit, setEditingHabit] = useState(null);
  const [showForm, setShowForm] = useState(false);

  if (loading || !user) return <LoadingDashboard />;

  const todayCount = Object.values(checkIns).filter((entry) => {
    const now = new Date();
    const today = new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
    return entry.day === today;
  }).length;
  const dueHabits = habits.filter((habit) => habit.deadline).length;

  function openCreate() {
    setEditingHabit(null);
    setShowForm(true);
  }

  function openEdit(habit) {
    setEditingHabit(habit);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingHabit(null);
  }

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <a className="brand" href="#dashboard" aria-label="Daywell dashboard"><span className="brand-mark">d</span><span>daywell</span></a>
        <div className="topbar-right"><span className="today-label">{dateLabel()}</span><span className="topbar-divider" /><div className="user-avatar" aria-label={`Signed in as ${user.username}`}>{initials(user.username)}</div><span className="user-name">{user.username}</span><button className="logout-button" type="button" onClick={onLogout}>Sign out <span aria-hidden="true">↗</span></button></div>
      </header>

      <div className="dashboard-content">
        <section className="welcome-row">
          <div><p className="eyebrow">YOUR LITTLE CORNER OF CALM</p><h1>Good day, {user.username} <span className="wave">✳</span></h1><p className="welcome-copy">Every small promise you keep is a way forward.</p></div>
          <button className="button button-primary add-habit-button" type="button" onClick={openCreate}><span className="plus">+</span> New habit</button>
        </section>

        {error && <div className="page-alert" role="alert"><span>!</span><p>{error}</p><button type="button" onClick={() => window.location.reload()}>Try again</button></div>}

        <section className="summary-strip" aria-label="Habit overview">
          <div className="summary-item"><span className="summary-label">IN YOUR GARDEN</span><strong>{habits.length.toString().padStart(2, '0')}</strong><span className="summary-detail">{habits.length === 1 ? 'growing habit' : 'growing habits'}</span></div>
          <div className="summary-rule" />
          <div className="summary-item"><span className="summary-label">TODAY'S CHECK-INS</span><strong>{todayCount.toString().padStart(2, '0')}</strong><span className="summary-detail">{todayCount === 1 ? 'promise kept' : 'promises kept'}</span></div>
          <div className="summary-rule" />
          <div className="summary-item"><span className="summary-label">WITH A DEADLINE</span><strong>{dueHabits.toString().padStart(2, '0')}</strong><span className="summary-detail">{dueHabits === 1 ? 'gentle milestone' : 'gentle milestones'}</span></div>
          <div className="summary-aside"><span className="summary-aside-icon">☼</span><span>Consistency over<br />intensity, always.</span></div>
        </section>

        <section className="habits-section">
          <div className="section-heading"><div><p className="eyebrow">ONE DAY AT A TIME</p><h2>Your habits <span className="habit-count">{habits.length}</span></h2></div>{habits.length > 0 && <button className="text-button" type="button" onClick={openCreate}>+ Add a habit</button>}</div>
          {habits.length === 0 ? (
            <div className="empty-state"><div className="empty-illustration"><span className="empty-sun">☼</span><span className="empty-stem">✳</span></div><p className="eyebrow">A BLANK PAGE, FULL OF POSSIBILITY</p><h3>Start with one small thing.</h3><p>Choose a habit that feels good to begin. The rest can grow from there.</p><button className="button button-primary" type="button" onClick={openCreate}><span className="plus">+</span> Create your first habit</button></div>
          ) : (
            <div className="habit-grid">{habits.map((habit) => <HabitCard key={habit.id} habit={habit} checkIn={checkIns[habit.id]} onEdit={openEdit} onDelete={onDeleteHabit} onCheckIn={onCheckIn} />)}</div>
          )}
        </section>
        <footer className="dashboard-footer"><span>A little progress is still progress.</span><span>Made for your everyday ☼</span></footer>
      </div>
      {showForm && <HabitForm habit={editingHabit} onSave={onSaveHabit} onClose={closeForm} />}
    </main>
  );
}
