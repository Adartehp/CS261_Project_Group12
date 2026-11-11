document.addEventListener('DOMContentLoaded', () => {
    const menuHomeBtn = document.getElementById('menuHomeBtn');
    const backBtn = document.getElementById('backBtn');
    const repairForm = document.getElementById('repairForm');

    const detailsTextarea = document.getElementById('details');
    const currentCountSpan = document.getElementById('currentCount');
    const submitBtn = document.getElementById('submitBtn');

    const modalOverlay = document.getElementById('modalOverlay');
    const successModal = document.getElementById('successModal');
    const errorModal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');

    const closeSuccessBtn = document.getElementById('closeSuccessBtn');
    const closeErrorBtn = document.getElementById('closeErrorBtn');

    function goToHomePage() {
        window.location.href = 'index.html'; // หรือเปลี่ยนเป็น select.html ตามหน้าที่ต้องการ
    }

    // ป้องกัน Error กรณีไม่มี menuHomeBtn ในหน้า HTML แล้ว
    if (menuHomeBtn) {
        menuHomeBtn.addEventListener('click', goToHomePage);
    }
    
    if (backBtn) {
        backBtn.addEventListener('click', goToHomePage);
    }

    if (repairForm) {
        repairForm.addEventListener('submit', (event) => {
            event.preventDefault();
        });
    }

    if (detailsTextarea && currentCountSpan) {
        detailsTextarea.addEventListener('input', () => {
            currentCountSpan.textContent = detailsTextarea.value.length;
        });
    }

    function showModal(type, message = '') {
        modalOverlay.classList.add('active');

        if (successModal) {
            successModal.style.display = type === 'success' ? 'flex' : 'none';
        }
        if (errorModal) {
            errorModal.style.display = type === 'error' ? 'flex' : 'none';
        }
        if (errorMessage) {
            errorMessage.textContent = message;
        }
    }

    function hideModal() {
        modalOverlay.classList.remove('active');
        if (successModal) successModal.style.display = 'none';
        if (errorModal) errorModal.style.display = 'none';
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const requestData = {
                studentId: document.getElementById('studentId').value.trim(),
                roomNumber: document.getElementById('room').value.trim(),
                area: document.getElementById('area').value,
                repairItem: document.getElementById('repairItem').value,
                description: detailsTextarea ? detailsTextarea.value.trim() : ''
            };

            submitBtn.disabled = true;
            submitBtn.textContent = 'กำลังส่ง...';

            try {
                const response = await fetch('/api/repair-requests', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                });

                if (response.status === 201) {
                    showModal('success');
                } else {
                    const errorData = await response.json().catch(() => ({}));

                    showModal(
                        'error',
                        errorData.message ||
                        'ส่งข้อมูลไม่สำเร็จ กรุณาตรวจสอบข้อมูลแล้วลองใหม่'
                    );
                }
            } catch (error) {
                showModal(
                    'error',
                    'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบว่า Spring Boot กำลังทำงาน'
                );
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'แจ้งซ่อม';
            }
        });
    }

    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', goToHomePage);
    }
    
    if (closeErrorBtn) {
        closeErrorBtn.addEventListener('click', hideModal);
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', (event) => {
            if (
                event.target === modalOverlay &&
                errorModal && errorModal.style.display === 'flex'
            ) {
                hideModal();
            }
        });
    }
});