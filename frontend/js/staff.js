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

    let selectedRequestId = null;

    function statusText(status) {
        const labels = {
            PENDING: 'รอรับเรื่อง',
            IN_PROGRESS: 'รับเรื่องแล้ว',
            COMPLETED: 'เสร็จสิ้น'
        };
        return labels[status] ?? status;
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
        selectedRequestId = null;
    }

    async function openDetails(id) {
        selectedRequestId = id;
        modalItem.textContent = 'กำลังโหลด...';
        modalDescription.textContent = '';
        submitBtn.disabled = true;
        submitBtn.textContent = 'กำลังโหลด...';
        modalOverlay.classList.add('active');

        try {
            const request = await callApi(`/api/repair-requests/${id}`);
            if (selectedRequestId !== id) return;

            const acceptedTime = request.acceptedAt || request.updatedAt;

            modalItem.textContent = request.repairItem;
            modalDescription.style.whiteSpace = 'pre-wrap';
            modalDescription.textContent = [
                `รหัสนักศึกษา: ${request.studentId}`,
                `ห้อง: ${request.roomNumber}`,
                `พื้นที่: ${request.area}`,
                `รายละเอียด: ${request.description || '-'}`,
                `แจ้งเมื่อ: ${formatDateTime(request.createdAt)}`,
                `รับเรื่องเมื่อ: ${formatDateTime(acceptedTime)}`,
                `สถานะ: ${statusText(request.status)}`
            ].join('\n');

            submitBtn.disabled = true;
            submitBtn.textContent = statusText(request.status);
        } catch (error) {
            if (selectedRequestId !== id) return;
            modalItem.textContent = 'โหลดรายละเอียดไม่สำเร็จ';
            modalDescription.textContent = error.message;
            submitBtn.disabled = true;
        }
    }

    async function loadHistoryRequests() {
        container.style.textAlign = 'center';
        container.style.padding = '30px';
        container.style.color = '#64748b';
        container.textContent = 'กำลังโหลดข้อมูลประวัติ...';

        try {
            const allRequests = await callApi('/api/repair-requests');
            
            // กรองเฉพาะรายการที่ "รับเรื่องแล้ว" (ตัดรายการ PENDING / รอรับเรื่อง ออก)
            const acceptedRequests = (allRequests || []).filter(req => 
                req.status && req.status !== 'PENDING' && req.status !== 'รอรับเรื่อง'
            );

            container.replaceChildren();

            if (acceptedRequests.length === 0) {
                container.textContent = 'ยังไม่มีประวัติการรับเรื่อง';
                return;
            }

            container.style.textAlign = 'left';
            container.style.padding = '20px';

            acceptedRequests.forEach((request) => {
                const card = document.createElement('div');
                card.className = 'card open-modal';

                function addRow(labelText, value) {
                    const row = document.createElement('div');
                    row.className = 'info-row';

                    const label = document.createElement('span');
                    label.className = 'label';
                    label.textContent = labelText;

                    const content = document.createElement('div');
                    content.className = 'skeleton-bar';
                    content.textContent = value ?? '-';

                    row.append(label, content);
                    card.appendChild(row);
                }

                const acceptedTime = request.acceptedAt || request.updatedAt;

                addRow('รหัสนักศึกษา :', request.studentId);
                addRow('รหัสห้องพัก :', request.roomNumber);
                addRow('รายการซ่อม :', request.repairItem);
                addRow('แจ้งเมื่อ :', formatDateTime(request.createdAt));
                addRow('รับเรื่องเมื่อ :', formatDateTime(acceptedTime));
                addRow('สถานะ :', statusText(request.status));

                card.addEventListener('click', () => openDetails(request.id));
                container.appendChild(card);
            });
        } catch (error) {
            container.textContent = `โหลดรายการไม่สำเร็จ: ${error.message}`;
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