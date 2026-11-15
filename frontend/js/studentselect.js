document.addEventListener("DOMContentLoaded", async () => {
    // 1. ผูกปุ่มกดเปลี่ยนหน้าไว้ก่อนเลย (ปุ่มจะกดติด 100% แม้ยังโหลด Auth ไม่เสร็จ)
    const repairMenuBtn = document.getElementById("repairMenuBtn");
    const historyMenuBtn = document.getElementById("historyMenuBtn");

    if (repairMenuBtn) {
        repairMenuBtn.addEventListener("click", () => {
            window.location.href = "student.html";
        });
    }

    if (historyMenuBtn) {
        historyMenuBtn.addEventListener("click", () => {
            window.location.href = "studenthistory.html";
        });
    }

    // 2. โหลดภาษาที่บันทึกไว้
    let currentLang = "th";
    try {
        currentLang = localStorage.getItem("app_lang") || "th";
    } catch (e) {}

    const translations = {
        th: {
            docTitle: "เมนูนักศึกษา",
            logoutBtn: "ออกจากระบบ",
            logoutConfirm: "คุณต้องการออกจากระบบหรือไม่?",
            repairMenu: "แจ้งซ่อม",
            historyMenu: "ประวัติ"
        },
        en: {
            docTitle: "Student Menu",
            logoutBtn: "Log Out",
            logoutConfirm: "Do you want to log out?",
            repairMenu: "Request Repair",
            historyMenu: "History"
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

    // 3. ตรวจสอบสิทธิ์และแสดงชื่อนักศึกษา
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
});