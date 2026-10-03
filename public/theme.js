(() => {
  try {
    const saved = localStorage.getItem('sunday_plan_theme_v1');
    document.documentElement.classList.toggle('dark', saved !== 'light');
  } catch { document.documentElement.classList.add('dark'); }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', document.documentElement.classList.contains('dark') ? '#101612' : '#f2f5f1');
})();
