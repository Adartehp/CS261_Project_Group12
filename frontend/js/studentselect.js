document.addEventListener("DOMContentLoaded", async () => {
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
            if (confirm("คุณต้องการออกจากระบบหรือไม่?")) {
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
            alert("ระบบประวัติการแจ้งซ่อมกำลังอยู่ระหว่างการพัฒนา (Task 33)");
        });
    }
});
