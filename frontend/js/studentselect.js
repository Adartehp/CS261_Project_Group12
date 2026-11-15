document.addEventListener("DOMContentLoaded", async () => {
    // โหลดภาษาที่บันทึกไว้
    let currentLang = "th";
    try {
        currentLang = localStorage.getItem("app_lang") || "th";
    } catch (e) {}

    const translations = {
        th: {
            docTitle: "เมนูนักศึกษา",
            loading: "กำลังโหลด...",
            logoutBtn: "ออกจากระบบ",
            logoutConfirm: "คุณต้องการออกจากระบบหรือไม่?",
            repairMenu: "แจ้งซ่อม",
            historyMenu: "ประวัติ",
            historyAlert: "ระบบประวัติการแจ้งซ่อมกำลังอยู่ระหว่างการพัฒนา (Task 33)"
        },
        en: {
            docTitle: "Student Menu",
            loading: "Loading...",
            logoutBtn: "Log Out",
            logoutConfirm: "Do you want to log out?",
            repairMenu: "Request Repair",
            historyMenu: "History",
            historyAlert: "The repair history feature is currently under development (Task 33)"
        }
    };

    const t = translations[currentLang] || translations.th;
    document.documentElement.lang = currentLang;
    document.title = t.docTitle;

    const logoutBtnText = document.getElementById("logoutBtnText");
    const repairMenuText = document.getElementById("repairMenuText");
    const historyMenuText = document.getElementById("historyMenuText");

    if (logoutBtnText) logoutBtnText.textContent = t.logoutBtn;
    if (repairMenuText) repairMenuText.textContent = t.repairMenu;
    if (historyMenuText) historyMenuText.textContent = t.historyMenu;

    // ตรวจสอบสิทธิ์ว่าเป็นนักศึกษาที่ล็อกอินอยู่หรือไม่
    const user = await requireAuth("STUDENT");
    if (!user) return;

    const userNameDisplay = document.getElementById("userNameDisplay");
    if (userNameDisplay) {
        userNameDisplay.textContent = user.fullName || user.username;
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            if (confirm(t.logoutConfirm)) {
                logout();
            }
        });
    }

    const repairMenuBtn = document.getElementById("repairMenuBtn");
    const historyMenuBtn = document.getElementById("historyMenuBtn");

    if (repairMenuBtn) {
        repairMenuBtn.addEventListener("click", () => {
            window.location.href = "student.html";
        });
    }

    if (historyMenuBtn) {
        historyMenuBtn.addEventListener("click", () => {
            alert(t.historyAlert);
        });
    }
});
