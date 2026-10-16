document.addEventListener('DOMContentLoaded', () => {
    const menuHomeBtn = document.getElementById('menuHomeBtn');
    const backBtn = document.getElementById('backBtn');

    const detailsTextarea = document.getElementById('details');
    const currentCountSpan = document.getElementById('currentCount');
    const submitBtn = document.getElementById('submitBtn');

    const modalOverlay = document.getElementById('modalOverlay');
    const successModal = document.getElementById('successModal');
    const errorModal = document.getElementById('errorModal');
    const closeSuccessBtn = document.getElementById('closeSuccessBtn');
    const closeErrorBtn = document.getElementById('closeErrorBtn');

    function goToHomePage() {
        window.location.href = 'index.html';
    }

    if (menuHomeBtn) menuHomeBtn.addEventListener('click', goToHomePage);
    if (backBtn) backBtn.addEventListener('click', goToHomePage);

    if (detailsTextarea && currentCountSpan) {
        detailsTextarea.addEventListener('input', () => {
            const currentLength = detailsTextarea.value.length;
            currentCountSpan.textContent = currentLength;
        });
    }

    function showModal(type) {
        modalOverlay.classList.add('active');
        if (type === 'success') {
            successModal.style.display = 'flex';
            errorModal.style.display = 'none';
        } else {
            errorModal.style.display = 'flex';
            successModal.style.display = 'none';
        }
    }

    function hideModal() {
        modalOverlay.classList.remove('active');
        successModal.style.display = 'none';
        errorModal.style.display = 'none';
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            const room = document.getElementById('room').value.trim();
            const area = document.getElementById('area').value;
            const repairItem = document.getElementById('repairItem').value;

            if (!room || !area || !repairItem) {
                showModal('error');
            } else {
                showModal('success');
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
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay && errorModal.style.display === 'flex') {
                hideModal();
            }
        });
    }
});