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
        if (status === 'CANCELLED') return 'ยกเลิก';
        return status;
    }

    function statusColor(status) {
        if (status === 'DONE' || status === 'COMPLETED') return 'text-green-700';
        if (status === 'CANCELLED') return 'text-red-600';
        if (status === 'IN_PROGRESS') return 'text-blue-700';
        return 'text-amber-600';
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

    // US7: ปุ่มเปลี่ยนสถานะในป็อปอัพรายละเอียด
    const statusActions = document.getElementById('statusActions');
    const staffNote = document.getElementById('staffNote');
    const statusError = document.getElementById('statusError');
    const doneRequestBtn = document.getElementById('doneRequestBtn');
    const cancelRequestBtn = document.getElementById('cancelRequestBtn');
    let currentRequest = null;

    function showStatusError(message) {
        statusError.textContent = message;
        statusError.classList.toggle('hidden', !message);
    }

    // ซ่อมเสร็จได้เฉพาะ IN_PROGRESS ยกเลิกได้เมื่อ PENDING หรือ IN_PROGRESS (ตาม state diagram)
    function renderStatusActions(request) {
        const canDone = request.status === 'IN_PROGRESS';
        const canCancel = request.status === 'PENDING' || request.status === 'IN_PROGRESS';
        statusActions.classList.toggle('hidden', !canDone && !canCancel);
        doneRequestBtn.classList.toggle('hidden', !canDone);
        cancelRequestBtn.classList.toggle('hidden', !canCancel);
        staffNote.value = '';
        showStatusError('');
    }

    async function changeStatus(newStatus) {
        if (!currentRequest) return;
        const label = newStatus === 'DONE' ? 'ซ่อมเสร็จแล้ว' : 'ยกเลิกคำร้อง';
        if (!confirm(`ยืนยันเปลี่ยนสถานะเป็น "${label}" ใช่หรือไม่?`)) return;

        doneRequestBtn.disabled = true;
        cancelRequestBtn.disabled = true;
        try {
            await callApi(`/api/repair-requests/${currentRequest.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus, staffNote: staffNote.value.trim() || null })
            });
            closeModal();
            loadHistoryRequests();
        } catch (error) {
            showStatusError(error.message);
        } finally {
            doneRequestBtn.disabled = false;
            cancelRequestBtn.disabled = false;
        }
    }

    doneRequestBtn.addEventListener('click', () => changeStatus('DONE'));
    cancelRequestBtn.addEventListener('click', () => changeStatus('CANCELLED'));

    async function openDetails(id) {
        modalItem.textContent = 'กำลังโหลด...';
        modalDescription.textContent = '';
        submitBtn.textContent = 'ปิด';
        submitBtn.onclick = closeModal;
        currentRequest = null;
        statusActions.classList.add('hidden');
        modalOverlay.classList.add('active');

        try {
            const request = await callApi(`/api/repair-requests/${id}`);
            currentRequest = request;
            const areaThai = areaMap[request.area] || request.area || '-';
            const lines = [
                `รหัสนักศึกษา : ${request.studentId || '-'}`,
                `ห้อง : ${request.roomNumber || '-'}`,
                `พื้นที่ : ${areaThai}`,
                `รายละเอียด : ${request.description || '-'}`,
                `แจ้งเมื่อ : ${formatDateTime(request.createdAt)}`,
                `รับเรื่องเมื่อ : ${request.acceptedAt ? formatDateTime(request.acceptedAt) : 'ยังไม่รับเรื่อง'}`
            ];
            if (request.completedAt) lines.push(`ซ่อมเสร็จเมื่อ : ${formatDateTime(request.completedAt)}`);
            lines.push(`สถานะ : ${statusText(request.status)}`);
            if (request.staffNote) lines.push(`หมายเหตุ : ${request.staffNote}`);

            modalItem.textContent = request.repairItem || '-';
            modalDescription.style.whiteSpace = 'pre-wrap';
            modalDescription.textContent = lines.join('\n');
            renderStatusActions(request);
        } catch (error) {
            modalItem.textContent = 'โหลดรายละเอียดไม่สำเร็จ';
            modalDescription.textContent = error.message;
        }
    }

    const filterForm = document.getElementById('filterForm');
    const filterError = document.getElementById('filterError');
    const filterReset = document.getElementById('filterReset');
    const resultCount = document.getElementById('resultCount');
    const filterFields = ['status', 'area', 'room', 'studentId', 'from', 'to'];

    function showFilterError(message) {
        filterError.textContent = message;
        filterError.classList.toggle('hidden', !message);
    }

    // อ่านค่าตัวกรองจากฟอร์ม แล้วสร้าง query string สำหรับ GET /api/repair-requests
    function buildFilterQuery() {
        const formData = new FormData(filterForm);
        const params = new URLSearchParams();
        filterFields.forEach((name) => {
            const value = (formData.get(name) || '').toString().trim();
            if (value) params.set(name, value);
        });
        return params;
    }

    async function loadHistoryRequests() {
        const params = buildFilterQuery();
        const from = params.get('from');
        const to = params.get('to');

        if (from && to && from > to) {
            showFilterError('วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด');
            container.innerHTML = '';
            resultCount.textContent = '';
            return;
        }
        showFilterError('');

        container.innerHTML = '<p class="text-center text-gray-500 py-6">กำลังโหลดข้อมูลประวัติ...</p>';
        resultCount.textContent = '';

        try {
            const query = params.toString();
            const requests = (await callApi('/api/repair-requests' + (query ? `?${query}` : ''))) || [];

            container.innerHTML = '';
            resultCount.textContent = query
                ? `พบ ${requests.length} รายการตามเงื่อนไข`
                : `ทั้งหมด ${requests.length} รายการ`;

            if (requests.length === 0) {
                const emptyText = query ? 'ไม่พบรายการที่ตรงกับเงื่อนไข' : 'ไม่มีข้อมูล';
                container.innerHTML = `<p class="text-center text-gray-500 py-6 font-medium">${emptyText}</p>`;
                return;
            }

            requests.forEach((request) => {
                const acceptedTime = request.acceptedAt ? formatDateTime(request.acceptedAt) : 'ยังไม่รับเรื่อง';
                const areaThai = areaMap[request.area] || request.area || '-';

                const itemEl = document.createElement('div');
                itemEl.className = 'bg-white p-5 rounded-xl border border-[#c4ddf5] shadow-sm space-y-2 cursor-pointer hover:border-[#d63b15] transition';
                itemEl.innerHTML = `
                    <div class="flex justify-between text-sm text-gray-700">
                        <span>รหัสนักศึกษา : <strong>${escapeHtml(request.studentId || '-')}</strong></span>
                        <span>รหัสห้องพัก : <strong>${escapeHtml(request.roomNumber || '-')}</strong></span>
                    </div>
                    <div class="text-sm text-gray-800">พื้นที่ : <strong>${escapeHtml(areaThai)}</strong> | รายการซ่อม : <strong>${escapeHtml(request.repairItem || '-')}</strong></div>
                    <div class="text-xs text-gray-600 pt-1 border-t border-gray-100 space-y-1">
                        <div>แจ้งเมื่อ : <strong>${escapeHtml(formatDateTime(request.createdAt))}</strong></div>
                        <div>รับเรื่องเมื่อ : <strong>${escapeHtml(acceptedTime)}</strong></div>
                    </div>
                    <div class="text-sm ${statusColor(request.status)} font-semibold pt-1">สถานะ : ${escapeHtml(statusText(request.status))}</div>
                `;

                itemEl.addEventListener('click', () => openDetails(request.id));
                container.appendChild(itemEl);
            });
        } catch (error) {
            container.innerHTML = '';
            resultCount.textContent = '';
            showFilterError(error.message || 'โหลดข้อมูลไม่สำเร็จ');
        }
    }

    filterForm.addEventListener('submit', (event) => {
        event.preventDefault();
        loadHistoryRequests();
    });

    filterReset.addEventListener('click', () => {
        filterForm.reset();
        loadHistoryRequests();
    });

    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) closeModal();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeModal();
    });

    loadHistoryRequests();
});