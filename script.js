const toggleSidebarBtn = document.getElementById('toggleSidebar');
const toggleThemeBtn = document.getElementById('toggleTheme');
const sidebar = document.getElementById('sidebar');

// Sidebar toggle for mobile
toggleSidebarBtn.addEventListener('click', () => {
  sidebar.classList.toggle('active');
});

// Dark/light mode toggle
toggleThemeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
});
