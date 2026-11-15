document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const errorMsg = document.getElementById("errorMsg");
    const submitBtn = document.getElementById("submitBtn");

    function showError(message) {
        if (errorMsg) {
            errorMsg.textContent = message;
            errorMsg.style.display = "block";
        }
    }

    function clearError() {
        if (errorMsg) {
            errorMsg.textContent = "";
            errorMsg.style.display = "none";
        }
    }

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            clearError();

            const username = usernameInput ? usernameInput.value.trim() : "";
            const password = passwordInput ? passwordInput.value.trim() : "";

            if (!username || !password) {
                showError("กรุณากรอกอีเมลและรหัสนักศึกษา");
                return;
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = "กำลังเข้าสู่ระบบ...";
            }

            try {
                const response = await fetch("/api/auth/student/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "same-origin",
                    body: JSON.stringify({ username, password })
                });

                if (response.ok) {
                    window.location.href = "studentselect.html";
                } else {
                    const errData = await response.json().catch(() => ({}));
                    showError(errData.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
                }
            } catch (err) {
                showError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต");
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = "เข้าสู่ระบบ";
                }
            }
        });
    }
});
