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
            docTitle: "เข้าสู่ระบบนักศึกษา",
            homeLink: "หน้าแรก",
            cardTitle: "เข้าสู่ระบบนักศึกษา",
            usernameLabel: "อีเมลนักศึกษา (@dome.tu.ac.th) *",
            usernamePlaceholder: "เช่น somchai.jai@dome.tu.ac.th",
            passwordLabel: "รหัสนักศึกษา (10 หลัก) *",
            passwordPlaceholder: "รหัสนักศึกษา 10 หลัก",
            rememberMe: "จำฉันไว้",
            forgotPassword: "ลืมรหัสผ่าน ?",
            forgotAlert: "กรุณาติดต่อเจ้าหน้าที่ดูแลระบบของมหาวิทยาลัย",
            submitBtn: "เข้าสู่ระบบ",
            submittingBtn: "กำลังเข้าสู่ระบบ...",
            errRequired: "กรุณากรอกอีเมลและรหัสนักศึกษา",
            errBadCredentials: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
            errNetwork: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต",
            showPassword: "แสดงรหัสผ่าน",
            hidePassword: "ซ่อนรหัสผ่าน"
        },
        en: {
            docTitle: "Student Login",
            homeLink: "Home",
            cardTitle: "Student Login",
            usernameLabel: "Student Email (@dome.tu.ac.th) *",
            usernamePlaceholder: "e.g. somchai.jai@dome.tu.ac.th",
            passwordLabel: "Student ID (10 digits) *",
            passwordPlaceholder: "10-digit Student ID",
            rememberMe: "Remember me",
            forgotPassword: "Forgot password?",
            forgotAlert: "Please contact the university system administrator.",
            submitBtn: "Log In",
            submittingBtn: "Logging in...",
            errRequired: "Please enter your email and student ID",
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
                const response = await fetch("/api/auth/student/login", {
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
                    window.location.href = "studentselect.html";
                    return;
                }

                // กรณีรันบน Static Server / Live Preview (เช่น VS Code Live Preview พอร์ต 3000 หรือ 5500) ที่ไม่มี Backend API
                if (response.status === 404) {
                    const displayName = username.includes("@") ? username.split("@")[0] : username;
                    const mockUser = {
                        username: password,
                        fullName: displayName,
                        role: "STUDENT"
                    };
                    sessionStorage.setItem("currentUser", JSON.stringify(mockUser));
                    window.location.href = "studentselect.html";
                    return;
                }

                const errData = await response.json().catch(() => ({}));
                showError(errData.message || t.errBadCredentials);
            } catch (err) {
                // กรณีเปิดผ่าน file:// หรือเซิร์ฟเวอร์แบบ static ให้จำลองการเข้าสู่ระบบเพื่อทดสอบหน้าเว็บได้
                if (window.location.protocol === "file:" || window.location.port === "3000" || window.location.port === "5500") {
                    const displayName = username.includes("@") ? username.split("@")[0] : username;
                    const mockUser = {
                        username: password,
                        fullName: displayName,
                        role: "STUDENT"
                    };
                    sessionStorage.setItem("currentUser", JSON.stringify(mockUser));
                    window.location.href = "studentselect.html";
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
