document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            if (username && password) {
                window.location.href = 'studentselect.html';
            }
        });
    }
});