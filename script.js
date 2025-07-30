// Sidebar toggle
const menuToggle = document.getElementById('menuToggle');
const nav = document.getElementById('sidebarNav');

menuToggle.addEventListener('click', () => {
  nav.classList.toggle('show');
});

// Theme toggle
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

function setTheme(mode) {
  if (mode === 'light') {
    body.classList.add('light-mode');
    themeToggle.innerHTML = '🌙';
  } else {
    body.classList.remove('light-mode');
    themeToggle.innerHTML = '☀️';
  }
  localStorage.setItem('theme', mode);
}

themeToggle.addEventListener('click', () => {
  const isLight = body.classList.contains('light-mode');
  setTheme(isLight ? 'dark' : 'light');
});

// Load saved theme
const savedTheme = localStorage.getItem('theme') || 'dark';
setTheme(savedTheme);
