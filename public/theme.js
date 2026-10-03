(() => {
  try {
    const saved = localStorage.getItem('sunday_plan_theme_v1');
    document.documentElement.classList.toggle('dark', saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches));
  } catch { /* The app handles unavailable storage after mounting. */ }
})();
