document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            if (username && password) {
                // เปลี่ยนหน้าไปยัง select.html เมื่อเข้าสู่ระบบสำเร็จ
                window.location.href = 'studentselect.html';
            }
        });
    }
});