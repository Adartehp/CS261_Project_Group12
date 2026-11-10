document.addEventListener('DOMContentLoaded', () => {
    const repairMenuBtn = document.getElementById('repairMenuBtn');
    const historyMenuBtn = document.getElementById('historyMenuBtn');

    if (repairMenuBtn) {
        repairMenuBtn.addEventListener('click', () => {
            window.location.href = 'student.html';
        });
    }

    if (historyMenuBtn) {
        historyMenuBtn.addEventListener('click', () => {
            alert('นำทางไปยังหน้าประวัติการแจ้งซ่อม');
         
        });
    }
});