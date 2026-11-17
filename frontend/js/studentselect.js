document.addEventListener("DOMContentLoaded", async () => {
    document.documentElement.lang = "th";
    document.title = "เมนูนักศึกษา";

    // ผูกปุ่มเปลี่ยนหน้า
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

    const logoutBtnText = document.getElementById("logoutBtnText");
    const repairMenuText = document.getElementById("repairMenuText");
    const historyMenuText = document.getElementById("historyMenuText");

    if (logoutBtnText) logoutBtnText.textContent = "ออกจากระบบ";
    if (repairMenuText) repairMenuText.textContent = "แจ้งซ่อม";
    if (historyMenuText) historyMenuText.textContent = "ประวัติ";

    // ตรวจสอบสิทธิ์นักศึกษา
    const user = await requireAuth("STUDENT");
    if (!user) return;

    const userNameDisplay = document.getElementById("userNameDisplay");
    if (userNameDisplay) {
        userNameDisplay.textContent = user.fullName || user.username;
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            if (confirm("คุณต้องการออกจากระบบหรือไม่?")) {
                logout();
            }
        });
    }
});