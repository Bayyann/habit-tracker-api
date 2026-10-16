import { useCallback, useEffect, useState } from 'react';
import AuthScreen from './components/AuthScreen.jsx';
import Dashboard from './components/Dashboard.jsx';
import NotFound from './components/NotFound.jsx';
import { ApiError, authApi, clearToken, getToken, habitsApi, saveToken } from './api.js';

export default function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [token, setToken] = useState(() => getToken());
  const [user, setUser] = useState(null);
  const [habits, setHabits] = useState([]);
  const [checkIns, setCheckIns] = useState({});
  const [loading, setLoading] = useState(Boolean(getToken()));
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [pageError, setPageError] = useState('');

  function navigate(path, replace = false) {
    if (replace) window.history.replaceState({}, '', path);
    else window.history.pushState({}, '', path);
    setPathname(path);
  }

  useEffect(() => {
    function handlePopState() {
      setPathname(window.location.pathname);
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (pathname === '/dashboard' && !token) navigate('/login', true);
    else if ((pathname === '/login' || pathname === '/register') && token) navigate('/dashboard', true);
  }, [pathname, token]);

  const expireSession = useCallback(() => {
    clearToken();
    setToken(null);
    setUser(null);
    setHabits([]);
    setCheckIns({});
    setPageError('Your session expired. Please sign in again.');
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return undefined;
    }
    let active = true;
    setLoading(true);
    setPageError('');
    Promise.all([authApi.me(), habitsApi.list()])
      .then(([currentUser, userHabits]) => {
        if (!active) return;
        setUser(currentUser);
        setHabits(userHabits);
      })
      .catch((error) => {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) expireSession();
        else setPageError(error.message || 'Could not load your habits.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, expireSession]);

  async function authenticate(credentials, register) {
    setAuthBusy(true);
    setAuthError('');
    try {
      if (register) await authApi.register(credentials);
      const result = await authApi.login(credentials);
      saveToken(result.access_token);
      setToken(result.access_token);
      navigate('/dashboard');
      setCheckIns({});
      setPageError('');
    } catch (error) {
      setAuthError(error.message || 'Could not sign in. Please try again.');
    } finally {
      setAuthBusy(false);
    }
  }

  function logout() {
    clearToken();
    setToken(null);
    navigate('/login');
    setUser(null);
    setHabits([]);
    setCheckIns({});
    setAuthError('');
    setPageError('');
  }

  async function saveHabit(habit, id) {
    try {
      const saved = id ? await habitsApi.update(id, habit) : await habitsApi.create(habit);
      setHabits((current) => id
        ? current.map((item) => item.id === id ? saved : item)
        : [saved, ...current]);
      setPageError('');
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) expireSession();
      throw error;
    }
  }

  async function deleteHabit(id) {
    try {
      await habitsApi.remove(id);
      setHabits((current) => current.filter((habit) => habit.id !== id));
      setCheckIns((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      setPageError('');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) expireSession();
      throw error;
    }
  }

  async function checkIn(id) {
    try {
      const result = await habitsApi.checkIn(id);
      setHabits((current) => current.map((habit) => (
        habit.id === id
          ? { ...habit, completed_check_ins: result.completed_check_ins }
          : habit
      )));
      setCheckIns((current) => ({
        ...current,
        [id]: { day: result.check_in.day, streak: result.current_streak },
      }));
      setPageError('');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) expireSession();
      throw error;
    }
  }

  const isKnownPath = ['/', '/login', '/register', '/dashboard'].includes(pathname);
  if (!isKnownPath) {
    return <NotFound onHome={() => navigate('/')} />;
  }

  if (!token || (!user && !loading)) {
    return (
      <AuthScreen
        initialMode={pathname === '/register' ? 'register' : 'login'}
        onModeChange={(mode) => navigate(mode === 'register' ? '/register' : '/login')}
        onAuthenticate={authenticate}
        busy={authBusy}
        error={authError || pageError}
      />
    );
  }

  return (
    <Dashboard
      user={user}
      habits={habits}
      checkIns={checkIns}
      loading={loading}
      error={pageError}
      onLogout={logout}
      onSaveHabit={saveHabit}
      onDeleteHabit={deleteHabit}
      onCheckIn={checkIn}
    />
  );
}
