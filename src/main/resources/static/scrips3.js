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
        window.location.href = 'index.html';
    }

    menuHomeBtn.addEventListener('click', goToHomePage);
    backBtn.addEventListener('click', goToHomePage);

    repairForm.addEventListener('submit', (event) => {
        event.preventDefault();
    });

    detailsTextarea.addEventListener('input', () => {
        currentCountSpan.textContent = detailsTextarea.value.length;
    });

    function showModal(type, message = '') {
        modalOverlay.classList.add('active');

        successModal.style.display =
            type === 'success' ? 'flex' : 'none';

        errorModal.style.display =
            type === 'error' ? 'flex' : 'none';

        errorMessage.textContent = message;
    }

    function hideModal() {
        modalOverlay.classList.remove('active');
        successModal.style.display = 'none';
        errorModal.style.display = 'none';
    }

    submitBtn.addEventListener('click', async () => {
        const requestData = {
            studentId: document.getElementById('studentId').value.trim(),
            roomNumber: document.getElementById('room').value.trim(),
            area: document.getElementById('area').value,
            repairItem: document.getElementById('repairItem').value,
            description: detailsTextarea.value.trim()
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

    closeSuccessBtn.addEventListener('click', goToHomePage);
    closeErrorBtn.addEventListener('click', hideModal);

    modalOverlay.addEventListener('click', (event) => {
        if (
            event.target === modalOverlay &&
            errorModal.style.display === 'flex'
        ) {
            hideModal();
        }
    });
});