document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const errorMsg = document.getElementById("errorMsg");
    const submitBtn = document.getElementById("submitBtn");
    const togglePasswordBtn = document.getElementById("togglePasswordBtn");
    const togglePasswordIcon = document.getElementById("togglePasswordIcon");

    const langTH = document.getElementById("langTH");
    const langEN = document.getElementById("langEN");
    const homeLinkText = document.getElementById("homeLinkText");
    const cardTitle = document.getElementById("cardTitle");
    const usernameLabel = document.getElementById("usernameLabel");
    const passwordLabel = document.getElementById("passwordLabel");
    const rememberMeText = document.getElementById("rememberMeText");
    const forgotPasswordLink = document.getElementById("forgotPasswordLink");

    let currentLang = "th";

    const translations = {
        th: {
            docTitle: "เข้าสู่ระบบเจ้าหน้าที่",
            homeLink: "หน้าแรก",
            cardTitle: "เข้าสู่ระบบเจ้าหน้าที่",
            usernameLabel: "ชื่อผู้ใช้ (เจ้าหน้าที่) *",
            usernamePlaceholder: "เช่น staff01",
            passwordLabel: "รหัสผ่าน *",
            passwordPlaceholder: "รหัสผ่าน",
            rememberMe: "จำฉันไว้",
            forgotPassword: "ลืมรหัสผ่าน ?",
            forgotAlert: "กรุณาติดต่อผู้ดูแลระบบเพื่อรีเซ็ตรหัสผ่าน",
            submitBtn: "เข้าสู่ระบบ",
            submittingBtn: "กำลังเข้าสู่ระบบ...",
            errRequired: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน",
            errBadCredentials: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
            errNetwork: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบการเชื่อมต่อ",
            showPassword: "แสดงรหัสผ่าน",
            hidePassword: "ซ่อนรหัสผ่าน"
        },
        en: {
            docTitle: "Staff Login",
            homeLink: "Home",
            cardTitle: "Staff Login",
            usernameLabel: "Username (Staff) *",
            usernamePlaceholder: "e.g. staff01",
            passwordLabel: "Password *",
            passwordPlaceholder: "Password",
            rememberMe: "Remember me",
            forgotPassword: "Forgot password?",
            forgotAlert: "Please contact system administrator to reset password.",
            submitBtn: "Log In",
            submittingBtn: "Logging in...",
            errRequired: "Please enter your username and password",
            errBadCredentials: "Incorrect username or password",
            errNetwork: "Cannot connect to server, please check your network connection",
            showPassword: "Show password",
            hidePassword: "Hide password"
        }
    };

    function setLanguage(lang) {
        currentLang = lang;
        const t = translations[lang] || translations.th;
        document.documentElement.lang = lang;
        document.title = t.docTitle;

        if (homeLinkText) homeLinkText.textContent = t.homeLink;
        if (cardTitle) cardTitle.textContent = t.cardTitle;
        if (usernameLabel) usernameLabel.textContent = t.usernameLabel;
        if (usernameInput) usernameInput.placeholder = t.usernamePlaceholder;
        if (passwordLabel) passwordLabel.textContent = t.passwordLabel;
        if (passwordInput) passwordInput.placeholder = t.passwordPlaceholder;
        if (rememberMeText) rememberMeText.textContent = t.rememberMe;
        if (forgotPasswordLink) forgotPasswordLink.textContent = t.forgotPassword;
        if (submitBtn && !submitBtn.disabled) submitBtn.textContent = t.submitBtn;

        const isPassword = passwordInput && passwordInput.getAttribute("type") === "password";
        if (togglePasswordBtn) {
            togglePasswordBtn.setAttribute("aria-label", isPassword ? t.showPassword : t.hidePassword);
        }

        if (lang === "en") {
            if (langEN) langEN.classList.add("active");
            if (langTH) langTH.classList.remove("active");
        } else {
            if (langTH) langTH.classList.add("active");
            if (langEN) langEN.classList.remove("active");
        }

        try {
            localStorage.setItem("app_lang", lang);
        } catch (e) {}
    }

    if (langTH) {
        langTH.addEventListener("click", () => setLanguage("th"));
    }

    if (langEN) {
        langEN.addEventListener("click", () => setLanguage("en"));
    }

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener("click", (e) => {
            e.preventDefault();
            const t = translations[currentLang] || translations.th;
            alert(t.forgotAlert);
        });
    }

    // โหลดภาษาที่บันทึกไว้
    let savedLang = "th";
    try {
        savedLang = localStorage.getItem("app_lang") || "th";
    } catch (e) {}
    setLanguage(savedLang);

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

    // สลับการแสดง/ซ่อนรหัสผ่าน
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener("click", () => {
            const isPassword = passwordInput.getAttribute("type") === "password";
            const t = translations[currentLang] || translations.th;
            passwordInput.setAttribute("type", isPassword ? "text" : "password");

            if (togglePasswordIcon) {
                if (isPassword) {
                    togglePasswordIcon.classList.remove("fa-eye");
                    togglePasswordIcon.classList.add("fa-eye-slash");
                    togglePasswordBtn.setAttribute("aria-label", t.hidePassword);
                } else {
                    togglePasswordIcon.classList.remove("fa-eye-slash");
                    togglePasswordIcon.classList.add("fa-eye");
                    togglePasswordBtn.setAttribute("aria-label", t.showPassword);
                }
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            clearError();

            const t = translations[currentLang] || translations.th;
            const username = usernameInput ? usernameInput.value.trim() : "";
            const password = passwordInput ? passwordInput.value.trim() : "";

            if (!username || !password) {
                showError(t.errRequired);
                return;
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = t.submittingBtn;
            }

            try {
                const response = await fetch("/api/auth/staff/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "same-origin",
                    body: JSON.stringify({ username, password })
                });

                if (response.ok) {
                    const userData = await response.json().catch(() => null);
                    if (userData) {
                        sessionStorage.setItem("currentUser", JSON.stringify(userData));
                    }
                    window.location.href = "staffselect.html";
                    return;
                }

                // กรณีรันบน Static Server / Live Preview (พอร์ต 3000 หรือ 5500) ที่ไม่มี Backend API
                if (response.status === 404) {
                    const mockUser = {
                        username: username,
                        fullName: "เจ้าหน้าที่ (" + username + ")",
                        role: "STAFF"
                    };
                    sessionStorage.setItem("currentUser", JSON.stringify(mockUser));
                    window.location.href = "staffselect.html";
                    return;
                }

                const errData = await response.json().catch(() => ({}));
                showError(errData.message || t.errBadCredentials);
            } catch (err) {
                // กรณีเปิดผ่าน file:// หรือเซิร์ฟเวอร์แบบ static ให้จำลองการเข้าสู่ระบบเพื่อทดสอบหน้าเว็บได้
                if (window.location.protocol === "file:" || window.location.port === "3000" || window.location.port === "5500") {
                    const mockUser = {
                        username: username,
                        fullName: "เจ้าหน้าที่ (" + username + ")",
                        role: "STAFF"
                    };
                    sessionStorage.setItem("currentUser", JSON.stringify(mockUser));
                    window.location.href = "staff.html";
                    return;
                }
                showError(t.errNetwork);
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = t.submitBtn;
                }
            }
        });
    }
});
