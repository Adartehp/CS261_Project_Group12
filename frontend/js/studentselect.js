document.addEventListener('DOMContentLoaded', async () => {
    const currentUser = await requireAuth('STUDENT');
    if (!currentUser) return;

    // ปุ่มออกจากระบบ
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('คุณต้องการออกจากระบบหรือไม่?')) logout();
        });
    }

    const latestLoading = document.getElementById('latest-status-loading');
    const latestContent = document.getElementById('latest-status-content');
    const historyLoading = document.getElementById('history-loading');
    const historyContainer = document.getElementById('history-container');

    try {
        const response = await fetch('/api/repair-requests', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin'
        });

        if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลได้');

        const data = await response.json();

        latestLoading.style.display = 'none';
        historyLoading.style.display = 'none';
        latestContent.style.display = 'block';
        historyContainer.style.display = 'block';

        if (!data || data.length === 0) {
            latestContent.innerHTML = '<p class="text-center text-gray-500 py-2">ยังไม่มีรายการแจ้งซ่อม</p>';
            historyContainer.innerHTML = '<p class="text-center text-gray-500 py-2">ยังไม่มีประวัติในระบบ</p>';
            return;
        }

        // รายการล่าสุด (ตัวแรกสุดในอาเรย์ หรือตัวล่าสุด)
        const latest = data[data.length - 1];
        
        document.getElementById('val-room').textContent = latest.roomNumber || '-';
        document.getElementById('val-date').textContent = latest.createdAt ? latest.createdAt.split('T')[0] : '-';
        document.getElementById('val-area').textContent = latest.area || '-';
        document.getElementById('val-time').textContent = latest.createdAt && latest.createdAt.includes('T') ? latest.createdAt.split('T')[1].substring(0, 5) : '-';
        document.getElementById('val-repairItem').textContent = latest.repairItem || '-';

        // จัดการ Progress Bar ตามสถานะ
        const status = latest.status || 'รอดำเนินการ';
        const step1 = document.getElementById('step-1');
        const step2 = document.getElementById('step-2');
        const step3 = document.getElementById('step-3');

        // รีเซ็ตสี
        [step1, step2, step3].forEach(el => el.className = "w-8 h-8 rounded-full bg-gray-300 text-white flex items-center justify-center text-sm font-bold shadow");

        if (status === 'รอดำเนินการ') {
            step1.className = "w-8 h-8 rounded-full bg-[#d63b15] text-white flex items-center justify-center text-sm font-bold shadow";
        } else if (status === 'ดำเนินการ' || status === 'กำลังดำเนินการ') {
            step1.className = "w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shadow";
            step2.className = "w-8 h-8 rounded-full bg-[#d63b15] text-white flex items-center justify-center text-sm font-bold shadow";
        } else if (status === 'เสร็จสิ้น') {
            step1.className = "w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shadow";
            step2.className = "w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shadow";
            step3.className = "w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shadow";
        }

        // แสดงรายการประวัติทั้งหมด
        historyContainer.innerHTML = '';
        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'bg-white p-4 rounded-xl border border-[#c4ddf5] shadow-sm space-y-1';
            card.innerHTML = `
                <div class="text-sm text-gray-700">รหัสห้องพัก : <strong>${item.roomNumber || '-'}</strong></div>
                <div class="text-sm text-gray-700">รายการซ่อม : <strong>${item.repairItem || item.area || '-'}</strong></div>
                <div class="text-sm text-gray-600">วันที่ : ${item.createdAt ? item.createdAt.split('T')[0] : '-'} | สถานะ : <span class="text-[#d63b15] font-semibold">${item.status || 'รอดำเนินการ'}</span></div>
            `;
            historyContainer.appendChild(card);
        });

    } catch (err) {
        latestLoading.textContent = 'ไม่สามารถโหลดข้อมูลสถานะได้';
        historyLoading.textContent = 'ไม่สามารถโหลดประวัติได้';
        latestLoading.style.color = '#dc2626';
        historyLoading.style.color = '#dc2626';
    }
});