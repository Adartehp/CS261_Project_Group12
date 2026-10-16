window.addEventListener('DOMContentLoaded', () => {
    const modalTriggers = document.querySelectorAll('.open-modal');
    const modalOverlay = document.getElementById('modalOverlay');
    const submitBtn = document.getElementById('submitBtn');
    const backBtn = document.getElementById('backBtn');

    modalTriggers.forEach(card => {
        card.addEventListener('click', () => {
            modalOverlay.classList.add('active');
        });
    });

    submitBtn.addEventListener('click', () => {
        alert('รับเรื่องแจ้งซ่อมเรียบร้อยแล้ว');
        modalOverlay.classList.remove('active');
    });

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.classList.remove('active');
        }
    });

    backBtn.addEventListener('click', () => {
        history.back();
    });
});