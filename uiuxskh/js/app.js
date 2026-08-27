/* ============================================
   Kopargaon Smart City - Shared JavaScript
   Navigation, Sidebar, and Interactions
   ============================================ */

// ---- Mobile Sidebar Toggle ----
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar && overlay) {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
    }
}

// Close sidebar when clicking overlay
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) {
        overlay.addEventListener('click', toggleSidebar);
    }
    
    // Mark active navigation item based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
            // Fill the icon for active state
            const icon = link.querySelector('.material-symbols-outlined');
            if (icon) {
                icon.style.fontVariationSettings = "'FILL' 1";
            }
        }
    });
    
    // Fade-in animation for stagger items
    const staggerItems = document.querySelectorAll('.stagger-item');
    staggerItems.forEach((item, index) => {
        item.style.animationDelay = `${index * 0.05}s`;
    });
});

// ---- Notification Badge ----
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-20 right-4 z-[100] px-6 py-4 rounded-xl shadow-ambient-lvl2 flex items-center gap-3 fade-in max-w-md`;
    
    const colors = {
        info: 'bg-primary-fixed text-primary',
        success: 'bg-tertiary-fixed text-tertiary',
        error: 'bg-error-container text-on-error-container',
        warning: 'bg-secondary-fixed text-secondary'
    };
    
    notification.classList.add(...(colors[type] || colors.info).split(' '));
    notification.innerHTML = `
        <span class="material-symbols-outlined">${type === 'error' ? 'error' : type === 'success' ? 'check_circle' : 'info'}</span>
        <span class="font-body-md text-body-md">${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        notification.style.transition = 'all 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ---- Language Switcher ----
function switchLanguage(lang) {
    const buttons = document.querySelectorAll('.lang-switch button');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.lang === lang) {
            btn.classList.add('active');
        }
    });
}

// ---- Dark Mode Toggle ----
function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('darkMode', isDark);
}

// Apply saved dark mode preference
(function() {
    if (localStorage.getItem('darkMode') === 'true') {
        document.documentElement.classList.add('dark');
    }
})();

// ---- Role Switcher (Sign In Page) ----
function switchRole(role) {
    const buttons = document.querySelectorAll('.role-btn');
    buttons.forEach(btn => {
        btn.classList.remove('bg-surface-container-lowest', 'text-primary', 'shadow-sm');
        btn.classList.add('text-on-surface-variant');
        if (btn.dataset.role === role) {
            btn.classList.add('bg-surface-container-lowest', 'text-primary', 'shadow-sm');
            btn.classList.remove('text-on-surface-variant');
        }
    });
}

// ---- Sign In Form Handler ----
function handleSignIn(event) {
    event.preventDefault();
    // Redirect to dashboard after "login"
    window.location.href = 'dashboard.html';
}

// ---- Search Functionality ----
function filterTable(inputId, tableId) {
    const input = document.getElementById(inputId);
    const table = document.getElementById(tableId);
    
    if (!input || !table) return;
    
    const filter = input.value.toLowerCase();
    const rows = table.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(filter) ? '' : 'none';
    });
}
