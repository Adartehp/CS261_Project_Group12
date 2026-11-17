document.addEventListener('DOMContentLoaded', async () => {
    const currentUser = await requireAuth('STUDENT');
    if (!currentUser) return;

    // 1. แสดงชื่อและรหัสนักศึกษาที่ลงทะเบียน
    const fullNameEl = document.getElementById('student-fullname');
    const studentIdEl = document.getElementById('student-id');
    if (fullNameEl) fullNameEl.textContent = currentUser.fullName || 'ไม่ระบุชื่อ';
    if (studentIdEl) studentIdEl.textContent = currentUser.username || '-';

    // 2. ปุ่มออกจากระบบ
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('คุณต้องการออกจากระบบหรือไม่?')) logout();
        });
    }

    const areaMap = {
        bedroom: 'ห้องนอน',
        restroom: 'ห้องนั่งเล่น (เฉพาะโซน B)',
        centerpoint: 'พื้นที่ส่วนกลาง',
        bathroom: 'ห้องน้ำ',
        balcony: 'ระเบียง+ลานซักผ้า',
        key: 'รายการกุญแจ',
        air: 'เครื่องปรับอากาศ (แอร์)'
    };

    // รายการซ่อมชุดเดียวกับฟอร์มแจ้งซ่อม (student.html)
    const repairItems = [
        'โต๊ะเครื่องแป้ง', 'ชั้นวางของ', 'บานเกล็ด', 'สัญญาณโทรทัศน์', 'พัดลมดูดอากาศ', 'อื่นๆ',
        'อินเทอร์เน็ต', 'กระจกเงา', 'ลูกบิดประตู', 'ผ้าม่าน', 'ประตูมุ้งลวด', 'ประตูกระจกบานเลื่อน',
        'ฟูกที่นอน', 'ประตู', 'หลอดไฟ', 'สวิทซ์ไฟ', 'รีโมทโทรทัศน์', 'รีโมทเครื่องปรับอากาศ',
        'พัดลมเพดาน', 'ตู้เย็น', 'ปลั๊กไฟ', 'โทรทัศน์', 'เครื่องปรับอากาศ', 'โต๊ะหัวเตียง',
        'โต๊ะรับประทานอาหาร', 'โต๊ะทำงาน', 'เตียง', 'ตู้เสื้อผ้า', 'เก้าอี้'
    ];

    const statusLabels = {
        PENDING: 'รอรับเรื่อง',
        IN_PROGRESS: 'รับเรื่องแล้ว',
        DONE: 'เสร็จสิ้น',
        COMPLETED: 'เสร็จสิ้น',
        CANCELLED: 'ยกเลิก'
    };

    const latestLoading = document.getElementById('latest-status-loading');
    const latestContent = document.getElementById('latest-status-content');
    const historyLoading = document.getElementById('history-loading');
    const historyContainer = document.getElementById('history-container');

    // เก็บ HTML เดิมของกล่องสถานะไว้ เพราะ showNoData() เขียนทับ
    const latestTemplate = latestContent.innerHTML;

    // ฟังก์ชันสำหรับแสดงผลเมื่อไม่มีข้อมูล
    function showNoData() {
        latestLoading.style.display = 'none';
        historyLoading.style.display = 'none';
        latestContent.style.display = 'block';
        historyContainer.style.display = 'block';

        latestContent.innerHTML = '<p class="text-center text-gray-500 py-4 font-medium">ไม่มีข้อมูล</p>';
        historyContainer.innerHTML = '<p class="text-center text-gray-500 py-4 font-medium">ไม่มีข้อมูล</p>';
        document.getElementById('historyCount').textContent = '';
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

    function renderLatest(latest) {
        latestContent.innerHTML = latestTemplate;

        const rawDate = latest.createdAt || latest.created_at || '';
        const datePart = rawDate.includes('T') ? rawDate.split('T')[0] : (rawDate.split(' ')[0] || '-');
        const timePart = rawDate.includes('T') ? rawDate.split('T')[1].substring(0, 5) : (rawDate.split(' ')[1]?.substring(0, 5) || '-');

        document.getElementById('val-room').textContent = latest.roomNumber || '-';
        document.getElementById('val-date').textContent = datePart;
        document.getElementById('val-area').textContent = areaMap[latest.area] || latest.area || '-';
        document.getElementById('val-time').textContent = timePart;
        document.getElementById('val-repairItem').textContent = latest.repairItem || '-';

        // อัปเดต Progress Bar
        const statusText = latest.status || 'รอรับเรื่อง';
        const step1 = document.getElementById('step-1');
        const step2 = document.getElementById('step-2');
        const step3 = document.getElementById('step-3');
        const base = 'w-8 h-8 rounded-full text-white flex items-center justify-center text-sm font-bold shadow';

        [step1, step2, step3].forEach(el => { el.className = `${base} bg-gray-300`; });

        if (statusText === 'รอรับเรื่อง' || statusText === 'รอดำเนินการ' || statusText === 'PENDING') {
            step1.className = `${base} bg-[#d63b15]`;
        } else if (statusText === 'รับเรื่องแล้ว' || statusText === 'ดำเนินการ' || statusText === 'กำลังดำเนินการ' || statusText === 'IN_PROGRESS') {
            step1.className = `${base} bg-green-600`;
            step2.className = `${base} bg-[#d63b15]`;
        } else if (statusText === 'เสร็จสิ้น' || statusText === 'COMPLETED' || statusText === 'DONE') {
            step1.className = `${base} bg-green-600`;
            step2.className = `${base} bg-green-600`;
            step3.className = `${base} bg-green-600`;
        }
    }

    function renderHistory(myRequests) {
        historyContainer.innerHTML = '';
        myRequests.forEach(item => {
            const itemArea = areaMap[item.area] || item.area || '-';
            const createdTime = formatDateTime(item.createdAt);
            // ใช้ acceptedAt เท่านั้น คำร้องที่ยกเลิกก่อนรับเรื่องจะไม่มีเวลารับเรื่อง
            const acceptedTime = item.acceptedAt ? formatDateTime(item.acceptedAt) : 'ยังไม่รับเรื่อง';
            const displayStatus = statusLabels[item.status] || item.status || 'รอรับเรื่อง';

            // US4: แก้ไขได้เฉพาะคำร้องที่ยังไม่มีการเปลี่ยนสถานะ
            const canEdit = item.status === 'PENDING';
            const editTitle = canEdit ? 'แก้ไขรายการแจ้งซ่อม' : 'แก้ไขไม่ได้ เพราะเจ้าหน้าที่เปลี่ยนสถานะแล้ว';

            const card = document.createElement('div');
            card.className = 'bg-white p-4 rounded-xl border border-[#c4ddf5] shadow-sm space-y-1.5';
            card.innerHTML = `
                <div class="flex justify-between text-sm text-gray-700">
                    <span>เลขที่ใบแจ้งซ่อม : <strong>#${escapeHtml(item.id)}</strong></span>
                    <span class="text-xs text-gray-500">รหัสนศ. ${escapeHtml(item.studentId)}</span>
                </div>
                <div class="text-sm text-gray-700">รหัสห้องพัก : <strong>${escapeHtml(item.roomNumber || '-')}</strong></div>
                <div class="text-sm text-gray-700">พื้นที่ : <strong>${escapeHtml(itemArea)}</strong> | รายการซ่อม : <strong>${escapeHtml(item.repairItem || '-')}</strong></div>
                <div class="text-xs text-gray-500">รายละเอียด : ${escapeHtml(item.description || '-')}</div>
                <div class="text-xs text-gray-600 pt-1 border-t border-gray-100 space-y-0.5">
                    <div>แจ้งเมื่อ : <strong>${escapeHtml(createdTime)}</strong></div>
                    <div>รับเรื่องเมื่อ : <strong>${escapeHtml(acceptedTime)}</strong></div>
                    ${item.completedAt ? `<div>ซ่อมเสร็จเมื่อ : <strong>${escapeHtml(formatDateTime(item.completedAt))}</strong></div>` : ''}
                    ${item.staffNote ? `<div>หมายเหตุจากเจ้าหน้าที่ : <strong>${escapeHtml(item.staffNote)}</strong></div>` : ''}
                </div>
                <div class="flex justify-between items-center pt-1 gap-2">
                    <div class="text-sm text-gray-600">สถานะ : <span class="text-[#d63b15] font-semibold">${escapeHtml(displayStatus)}</span></div>
                    <button type="button" class="edit-open-btn" title="${escapeHtml(editTitle)}" ${canEdit ? '' : 'disabled'}>
                        <i class="fa-solid fa-pen"></i> แก้ไข
                    </button>
                </div>
            `;
            if (canEdit) {
                card.querySelector('.edit-open-btn').addEventListener('click', () => openEdit(item));
            }
            historyContainer.appendChild(card);
        });
    }

    // US9 TC02: กรองประวัติตามสถานะ หรือค้นหาเลขที่ใบแจ้งซ่อม (กรองในหน้าเว็บ เพราะ /mine ส่งมาทั้งหมดแล้ว)
    const historyStatus = document.getElementById('historyStatus');
    const historySearch = document.getElementById('historySearch');
    const historyCount = document.getElementById('historyCount');
    let allMyRequests = [];

    function applyHistoryFilter() {
        const status = historyStatus.value;
        const ticket = historySearch.value.trim().replace(/^#/, '');
        const filtered = allMyRequests.filter(item =>
            (!status || item.status === status) &&
            (!ticket || String(item.id) === ticket)
        );

        historyCount.textContent = (status || ticket)
            ? `พบ ${filtered.length} รายการตามเงื่อนไข`
            : `ทั้งหมด ${allMyRequests.length} รายการ`;

        if (filtered.length === 0) {
            historyContainer.innerHTML = '<p class="text-center text-gray-500 py-4 font-medium">ไม่พบรายการที่ตรงกับเงื่อนไข</p>';
            return;
        }
        renderHistory(filtered);
    }

    historyStatus.addEventListener('change', applyHistoryFilter);
    historySearch.addEventListener('input', applyHistoryFilter);

    async function loadRequests() {
        try {
            const response = await fetch('/api/repair-requests/mine', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin'
            });

            if (response.status === 401) {
                window.location.href = 'studentlogin.html';
                return;
            }

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const rawData = await response.json();
            // /mine ส่งเฉพาะคำร้องของนักศึกษาที่ login อยู่ เรียงจากใหม่ไปเก่า
            const myRequests = Array.isArray(rawData) ? rawData : (rawData.data || rawData.content || []);

            if (myRequests.length === 0) {
                showNoData();
                return;
            }

            latestLoading.style.display = 'none';
            historyLoading.style.display = 'none';
            latestContent.style.display = 'block';
            historyContainer.style.display = 'block';

            allMyRequests = myRequests;
            renderLatest(myRequests[0]);
            applyHistoryFilter();
        } catch (err) {
            console.error('Fetch repair history error:', err);
            showNoData();
        }
    }

    // 3. ฟอร์มแก้ไขคำร้อง (US4)
    const editOverlay = document.getElementById('editOverlay');
    const editForm = document.getElementById('editForm');
    const editRoom = document.getElementById('editRoom');
    const editArea = document.getElementById('editArea');
    const editRepairItem = document.getElementById('editRepairItem');
    const editDescription = document.getElementById('editDescription');
    const editCount = document.getElementById('editCount');
    const editError = document.getElementById('editError');
    const editSave = document.getElementById('editSave');
    const editCancel = document.getElementById('editCancel');
    let editingId = null;

    function setRepairItemOptions(selected) {
        // ถ้าค่าเดิมไม่อยู่ในรายการ (เช่นข้อมูลจาก Sprint 1) ให้ใส่เพิ่มไว้ ไม่ให้ค่าเดิมหาย
        const items = selected && !repairItems.includes(selected) ? [selected, ...repairItems] : repairItems;
        editRepairItem.innerHTML = '<option value="" disabled>เลือกสิ่งที่ต้องการซ่อม</option>';
        items.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            editRepairItem.appendChild(option);
        });
        editRepairItem.value = selected || '';
    }

    function showEditError(message) {
        editError.textContent = message;
        editError.classList.toggle('hidden', !message);
    }

    function openEdit(item) {
        editingId = item.id;
        editRoom.value = item.roomNumber || '';
        editArea.value = areaMap[item.area] ? item.area : '';
        setRepairItemOptions(item.repairItem || '');
        editDescription.value = item.description || '';
        editCount.textContent = editDescription.value.length;
        showEditError('');
        editOverlay.classList.add('active');
        editRoom.focus();
    }

    function closeEdit() {
        editOverlay.classList.remove('active');
        editingId = null;
    }

    editDescription.addEventListener('input', () => {
        editCount.textContent = editDescription.value.length;
    });

    editCancel.addEventListener('click', closeEdit);
    editOverlay.addEventListener('click', (event) => {
        if (event.target === editOverlay) closeEdit();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && editOverlay.classList.contains('active')) closeEdit();
    });

    editForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const body = {
            roomNumber: editRoom.value.trim(),
            area: editArea.value,
            repairItem: editRepairItem.value,
            description: editDescription.value.trim()
        };

        if (!body.roomNumber || !body.area || !body.repairItem) {
            showEditError('กรุณากรอกรหัสห้องพัก เลือกพื้นที่ และเลือกรายการซ่อมให้ครบถ้วน');
            return;
        }

        editSave.disabled = true;
        editSave.textContent = 'กำลังบันทึก...';

        try {
            const response = await fetch(`/api/repair-requests/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(body)
            });
            const data = await response.json().catch(() => null);

            if (response.status === 401) {
                window.location.href = 'studentlogin.html';
                return;
            }

            if (!response.ok) {
                // 409 = เจ้าหน้าที่รับเรื่องไปแล้วระหว่างที่กำลังแก้ โหลดรายการใหม่ให้เห็นสถานะล่าสุด
                if (response.status === 409) await loadRequests();
                throw new Error(data?.message || `บันทึกไม่สำเร็จ (รหัสข้อผิดพลาด ${response.status})`);
            }

            closeEdit();
            await loadRequests();
        } catch (err) {
            showEditError(err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
        } finally {
            editSave.disabled = false;
            editSave.textContent = 'บันทึก';
        }
    });

    loadRequests();
});
