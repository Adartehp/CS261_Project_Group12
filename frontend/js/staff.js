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
    let accepting = false;

    function statusText(status) {
        const labels = {
            PENDING: 'รอรับเรื่อง',
            IN_PROGRESS: 'รับเรื่องแล้ว'
        };
        return labels[status] ?? status;
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
        if (accepting) return;
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

            modalItem.textContent = request.repairItem;
            modalDescription.style.whiteSpace = 'pre-wrap';
            modalDescription.textContent = [
                `รหัสนักศึกษา: ${request.studentId}`,
                `ห้อง: ${request.roomNumber}`,
                `พื้นที่: ${request.area}`,
                `รายละเอียด: ${request.description || '-'}`,
                `สถานะ: ${statusText(request.status)}`
            ].join('\n');

            submitBtn.disabled = request.status !== 'PENDING';
            submitBtn.textContent = request.status === 'PENDING' ? 'รับเรื่อง' : statusText(request.status);
        } catch (error) {
            if (selectedRequestId !== id) return;
            modalItem.textContent = 'โหลดรายละเอียดไม่สำเร็จ';
            modalDescription.textContent = error.message;
            submitBtn.textContent = 'รับเรื่อง';
            submitBtn.disabled = true;
        }
    }

    async function loadRequests() {
        container.style.textAlign = 'center';
        container.style.padding = '30px';
        container.style.color = '#64748b';
        container.textContent = 'กำลังโหลดข้อมูล...';

        try {
            const requests = await callApi('/api/repair-requests');
            container.replaceChildren();

            if (!requests || requests.length === 0) {
                container.textContent = 'ยังไม่มีรายการแจ้งซ่อม';
                return;
            }

            container.style.textAlign = 'left';
            container.style.padding = '20px';

            requests.forEach((request) => {
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

                addRow('รหัสนักศึกษา :', request.studentId);
                addRow('รหัสห้องพัก :', request.roomNumber);
                addRow('รายการซ่อม :', request.repairItem);
                addRow('สถานะ :', statusText(request.status));

                card.addEventListener('click', () => openDetails(request.id));
                container.appendChild(card);
            });
        } catch (error) {
            container.textContent = `โหลดรายการไม่สำเร็จ: ${error.message}`;
        }
    }

    submitBtn.addEventListener('click', async () => {
        if (selectedRequestId === null || accepting) return;
        const id = selectedRequestId;
        accepting = true;
        submitBtn.disabled = true;
        submitBtn.textContent = 'กำลังรับเรื่อง...';

        try {
            await callApi(`/api/repair-requests/${id}/accept`, { method: 'PATCH' });
            accepting = false;
            closeModal();
            alert('รับเรื่องแจ้งซ่อมเรียบร้อยแล้ว');
            await loadRequests();
        } catch (error) {
            accepting = false;
            alert(`รับเรื่องไม่สำเร็จ: ${error.message}`);
            await openDetails(id);
            await loadRequests();
        }
    });

    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) closeModal();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeModal();
    });

    loadRequests();
});