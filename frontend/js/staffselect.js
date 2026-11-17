document.addEventListener("DOMContentLoaded", async () => {
    const receiveMenuBtn = document.getElementById("receiveMenuBtn");
    const staffHistoryMenuBtn = document.getElementById("staffHistoryMenuBtn");

    if (receiveMenuBtn) {
        receiveMenuBtn.addEventListener("click", () => {
            window.location.href = "staffreceive.html";
        });
    }

    if (staffHistoryMenuBtn) {
        staffHistoryMenuBtn.addEventListener("click", () => {
            window.location.href = "staff.html"; // หน้าประวัติรวมของ Staff
        });
    }

    const user = await requireAuth("STAFF");
    if (!user) return;

    const userNameDisplay = document.getElementById("userNameDisplay");
    if (userNameDisplay) {
        userNameDisplay.textContent = user.fullName || user.username;
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            if (confirm("คุณต้องการออกจากระบบหรือไม่?")) logout();
        });
    }
});