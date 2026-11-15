document.addEventListener('DOMContentLoaded', async () => {
    const currentUser = await requireAuth('STUDENT');
    if (!currentUser) return;

    // 1. ตั้งค่าปุ่มออกจากระบบ
    const logoutBtn = document.getElementById('logoutBtn');
    if () {
        logoutBtn.addEventListener('click', () => {
            if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
                logout();
            }
        });
    }

    // 2. แสดงรหัสนักศึกษาอัตโนมัติในช่องรหัสนักศึกษา
    const studentIdInput = document.getElementById('studentId');
    if (studentIdInput && currentUser.username) {
        studentIdInput.value = currentUser.username;
        studentIdInput.readOnly = true;
    }

    // 3. นับจำนวนตัวอักษรในช่องรายละเอียด (สูงสุด 150 ตัวอักษร)
    const detailsInput = document.getElementById('details');
    const currentCount = document.getElementById('currentCount');
    if (detailsInput && currentCount) {
        detailsInput.addEventListener('input', () => {
            currentCount.textContent = detailsInput.value.length;
        });
    }

    // 4. จัดการหน้าต่างแจ้งเตือน (Modal) สำเร็จ / ไม่สำเร็จ
    const modalOverlay = document.getElementById('modalOverlay');
    const successModal = document.getElementById('successModal');
    const errorModal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    const closeSuccessBtn = document.getElementById('closeSuccessBtn');
    const closeErrorBtn = document.getElementById('closeErrorBtn');

    function showSuccess() {
        modalOverlay.style.display = 'flex';
        modalOverlay.classList.add('active');
        successModal.style.display = 'block';
        errorModal.style.display = 'none';
    }

    function showError(msg) {
        modalOverlay.style.display = 'flex';
        modalOverlay.classList.add('active');
        errorModal.style.display = 'block';
        successModal.style.display = 'none';
        if (errorMessage) errorMessage.textContent = msg;
    }

    function closeModals() {
        modalOverlay.style.display = 'none';
        modalOverlay.classList.remove('active');
        successModal.style.display = 'none';
        errorModal.style.display = 'none';
    }

    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', () => {
            closeModals();
            window.location.href = 'studentselect.html';
        });
    }

    if (closeErrorBtn) {
        closeErrorBtn.addEventListener('click', closeModals);
    }

    // 5. จัดการปุ่มกดส่งแจ้งซ่อมเข้า Backend -> MySQL
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const studentId = document.getElementById('studentId').value.trim();
            const roomNumber = document.getElementById('room').value.trim();
            const area = document.getElementById('area').value;
            const repairItem = document.getElementById('repairItem').value;
            const description = document.getElementById('details').value.trim();

            if (!roomNumber || !area || !repairItem) {
                showError('กรุณากรอกรหัสห้องพัก เลือกพื้นที่ และเลือกรายการซ่อมให้ครบถ้วน');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'กำลังส่งข้อมูล...';

            try {
                const response = await fetch('/api/repair-requests', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        studentId,
                        roomNumber,
                        area,
                        repairItem,
                        description
                    })
                });

                const data = await response.json().catch(() => null);

                if (!response.ok) {
                    throw new Error(data?.message || `บันทึกไม่สำเร็จ (รหัสข้อผิดพลาด ${response.status})`);
                }

                showSuccess();
            } catch (err) {
                showError(err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'แจ้งซ่อม';
            }
        });
    }
});