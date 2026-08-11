import { useEffect, useState } from 'preact/hooks';

type Theme = 'light' | 'dark' | 'system';

/* The initial value is already applied pre-paint by BaseLayout's inline script.
   This only reads it back so the control shows the right state. */
function current(): Theme {
  const stored = document.documentElement.getAttribute('data-theme');
  return stored === 'dark' || stored === 'light' ? stored : 'system';
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');
  useEffect(() => setTheme(current()), []);

  function cycle() {
    const next: Theme = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
    setTheme(next);
    try {
      if (next === 'system') {
        localStorage.removeItem('fixknee:theme');
        document.documentElement.removeAttribute('data-theme');
      } else {
        localStorage.setItem('fixknee:theme', next);
        document.documentElement.setAttribute('data-theme', next);
      }
    } catch {
      /* Storage blocked: the toggle still works for this page view. */
    }
  }

  const label = theme === 'system' ? 'Match system' : theme === 'light' ? 'Light' : 'Dark';
  return (
    <button type="button" class="theme-toggle" onClick={cycle} aria-live="polite">
      Theme: {label}
    </button>
  );
}
