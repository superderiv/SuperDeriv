const menuToggle = document.getElementById('menuToggle');
const sidebarNav = document.getElementById('sidebarNav');
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// Sidebar toggle
menuToggle.addEventListener('click', () => {
  sidebarNav.classList.toggle('show');
});

// Theme toggle
themeToggle.addEventListener('click', () => {
  const isLight = body.classList.contains('light-mode');
  body.classList.toggle('light-mode', !isLight);
  body.classList.toggle('dark-mode', isLight);
  themeToggle.textContent = isLight ? '🌙' : '☀️';
});
