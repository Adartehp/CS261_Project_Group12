document.addEventListener('DOMContentLoaded', async () => {
    const currentUser = await requireAuth('STAFF');
    if (!currentUser) return;

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
                logout();
            }
        });
    }

    const container = document.getElementById('notificationContainer');
    const modalOverlay = document.getElementById('modalOverlay');
    const submitBtn = document.getElementById('submitBtn');
    const modalItem = document.querySelector('.modal-input-sm');
    const modalDescription = document.querySelector('.modal-input-lg');

    const areaMap = {
        bedroom: 'ห้องนอน',
        restroom: 'ห้องนั่งเล่น (เฉพาะโซน B)',
        centerpoint: 'พื้นที่ส่วนกลาง',
        bathroom: 'ห้องน้ำ',
        balcony: 'ระเบียง+ลานซักผ้า',
        key: 'รายการกุญแจ',
        air: 'เครื่องปรับอากาศ (แอร์)'
    };

    function statusText(status) {
        if (!status || status === 'PENDING') return 'รอรับเรื่อง';
        if (status === 'IN_PROGRESS') return 'รับเรื่องแล้ว';
        if (status === 'COMPLETED' || status === 'DONE') return 'เสร็จสิ้น';
        return status;
    }

    function formatDateTime(isoString) {
        if (!isoString) return '-';
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return isoString;
        return d.toLocaleString('th-TH', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }) + ' น.';
    }

    async function callApi(url, options = {}) {
        options.credentials = 'same-origin';
        const response = await fetch(url, options);
        const data = await response.json().catch(() => null);

        if (!response.ok) {
            throw new Error(data?.message || `ดำเนินการไม่สำเร็จ (${response.status})`);
        }
        return data;
    }

    function closeModal() {
        modalOverlay.classList.remove('active');
    }

    async function openDetails(id) {
        modalItem.textContent = 'กำลังโหลด...';
        modalDescription.textContent = '';
        submitBtn.textContent = 'ปิด';
        submitBtn.onclick = closeModal;
        modalOverlay.classList.add('active');

        try {
            const request = await callApi(`/api/repair-requests/${id}`);
            const acceptedTime = request.acceptedAt || request.updatedAt;
            const areaThai = areaMap[request.area] || request.area || '-';

            modalItem.textContent = request.repairItem || '-';
            modalDescription.style.whiteSpace = 'pre-wrap';
            modalDescription.textContent = [
                `รหัสนักศึกษา : ${request.studentId || '-'}`,
                `ห้อง : ${request.roomNumber || '-'}`,
                `พื้นที่ : ${areaThai}`,
                `รายละเอียด : ${request.description || '-'}`,
                `แจ้งเมื่อ : ${formatDateTime(request.createdAt)}`,
                `รับเรื่องเมื่อ : ${formatDateTime(acceptedTime)}`,
                `สถานะ : ${statusText(request.status)}`
            ].join('\n');
        } catch (error) {
            modalItem.textContent = 'โหลดรายละเอียดไม่สำเร็จ';
            modalDescription.textContent = error.message;
        }
    }

    async function loadHistoryRequests() {
        container.innerHTML = '<p class="text-center text-gray-500 py-6">กำลังโหลดข้อมูลประวัติ...</p>';

        try {
            const allRequests = await callApi('/api/repair-requests');

            // กรองเฉพาะรายการที่รับเรื่องแล้ว
            const acceptedRequests = (allRequests || []).filter(req =>
                req.status && req.status !== 'PENDING' && req.status !== 'รอรับเรื่อง'
            );

            container.innerHTML = '';

            if (acceptedRequests.length === 0) {
                container.innerHTML = '<p class="text-center text-gray-500 py-6 font-medium">ไม่มีข้อมูล</p>';
                return;
            }

            acceptedRequests.forEach((request) => {
                const acceptedTime = request.acceptedAt || request.updatedAt;
                const areaThai = areaMap[request.area] || request.area || '-';

                const itemEl = document.createElement('div');
                itemEl.className = 'bg-white p-5 rounded-xl border border-[#c4ddf5] shadow-sm space-y-2 cursor-pointer hover:border-[#d63b15] transition';
                itemEl.innerHTML = `
                    <div class="flex justify-between text-sm text-gray-700">
                        <span>รหัสนักศึกษา : <strong>${request.studentId || '-'}</strong></span>
                        <span>รหัสห้องพัก : <strong>${request.roomNumber || '-'}</strong></span>
                    </div>
                    <div class="text-sm text-gray-800">พื้นที่ : <strong>${areaThai}</strong> | รายการซ่อม : <strong>${request.repairItem || '-'}</strong></div>
                    <div class="text-xs text-gray-600 pt-1 border-t border-gray-100 space-y-1">
                        <div>แจ้งเมื่อ : <strong>${formatDateTime(request.createdAt)}</strong></div>
                        <div>รับเรื่องเมื่อ : <strong>${formatDateTime(acceptedTime)}</strong></div>
                    </div>
                    <div class="text-sm text-green-700 font-semibold pt-1">สถานะ : ${statusText(request.status)}</div>
                `;

                itemEl.addEventListener('click', () => openDetails(request.id));
                container.appendChild(itemEl);
            });
        } catch (error) {
            container.innerHTML = '<p class="text-center text-gray-500 py-6 font-medium">ไม่มีข้อมูล</p>';
        }
    }

    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) closeModal();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeModal();
    });

    loadHistoryRequests();
});