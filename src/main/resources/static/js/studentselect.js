document.addEventListener('DOMContentLoaded', () => {
    const repairMenuBtn = document.getElementById('repairMenuBtn');
    const historyMenuBtn = document.getElementById('historyMenuBtn');

    if (repairMenuBtn) {
        repairMenuBtn.addEventListener('click', () => {
            // แก้ไขจาก 'student.html' เป็นชื่อไฟล์จริงของหน้าแจ้งซ่อม
            window.location.href = 'studentrequest.html';
        });
    }

    if (historyMenuBtn) {
        historyMenuBtn.addEventListener('click', () => {
            alert('นำทางไปยังหน้าประวัติการแจ้งซ่อม');
            // ถ้าหน้าประวัติมีไฟล์แยก เช่น history.html สามารถเปลี่ยนมาใช้แบบนี้ได้ครับ:
            // window.location.href = 'history.html';
        });
    }
});