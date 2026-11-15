document.addEventListener('DOMContentLoaded', async () => {
    const currentUser = await requireAuth('STUDENT');
    if (!currentUser) return;

    // 1. แสดงชื่อและรหัสนักศึกษาที่ลงทะเบียนจาก Session/API
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

    // แปลงรหัสพื้นที่จาก DB เป็นภาษาไทย
    const areaMap = {
        bedroom: 'ห้องนอน',
        restroom: 'ห้องนั่งเล่น (เฉพาะโซน B)',
        centerpoint: 'พื้นที่ส่วนกลาง',
        bathroom: 'ห้องน้ำ',
        balcony: 'ระเบียง+ลานซักผ้า',
        key: 'รายการกุญแจ',
        air: 'เครื่องปรับอากาศ (แอร์)'
    };

    // แปลงสถานะจาก DB (เผื่อ Backend ส่งเป็นภาษาอังกฤษ)
    const statusMap = {
        PENDING: 'รอดำเนินการ',
        IN_PROGRESS: 'ดำเนินการ',
        COMPLETED: 'เสร็จสิ้น',
        DONE: 'เสร็จสิ้น'
    };

    const latestLoading = document.getElementById('latest-status-loading');
    const latestContent = document.getElementById('latest-status-content');
    const historyLoading = document.getElementById('history-loading');
    const historyContainer = document.getElementById('history-container');

    try {
        // ดึงข้อมูลจาก /api/repair-requests (ส่ง studentId ไปด้วยเผื่อ API รองรับการกรอง)
        const response = await fetch(`/api/repair-requests?studentId=${encodeURIComponent(currentUser.username)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const rawData = await response.json();
        // รองรับทั้งกรณี API ส่งกลับเป็น Array ตรงๆ หรือห่ออยู่ใน { data: [...] } / { content: [...] }
        const allRequests = Array.isArray(rawData) ? rawData : (rawData.data || rawData.content || []);

        // กรองเอาเฉพาะรายการของรหัสนักศึกษาที่ล็อกอินอยู่
        const myRequests = allRequests.filter(item => !item.studentId || item.studentId === currentUser.username);

        latestLoading.style.display = 'none';
        historyLoading.style.display = 'none';
        latestContent.style.display = 'block';
        historyContainer.style.display = 'block';

        if (myRequests.length === 0) {
            latestContent.innerHTML = '<p class="text-center text-gray-500 py-2">ยังไม่มีรายการแจ้งซ่อมของคุณ</p>';
            historyContainer.innerHTML = '<p class="text-center text-gray-500 py-2">ยังไม่มีประวัติในระบบ</p>';
            return;
        }

        // รายการล่าสุด (ตัวแรกหรือตัวสุดท้ายขึ้นอยู่กับการเรียงจาก Backend)
        const latest = myRequests[0];
        const rawDate = latest.createdAt || latest.created_at || '';
        const datePart = rawDate.includes('T') ? rawDate.split('T')[0] : (rawDate.split(' ')[0] || '-');
        const timePart = rawDate.includes('T') ? rawDate.split('T')[1].substring(0, 5) : (rawDate.split(' ')[1]?.substring(0, 5) || '-');

        document.getElementById('val-room').textContent = latest.roomNumber || latest.room || '-';
        document.getElementById('val-date').textContent = datePart;
        document.getElementById('val-area').textContent = areaMap[latest.area] || latest.area || '-';
        document.getElementById('val-time').textContent = timePart;
        document.getElementById('val-repairItem').textContent = latest.repairItem || '-';

        // อัปเดตจุด Progress Bar
        const statusText = statusMap[latest.status] || latest.status || 'รอดำเนินการ';
        const step1 = document.getElementById('step-1');
        const step2 = document.getElementById('step-2');
        const step3 = document.getElementById('step-3');

        [step1, step2, step3].forEach(el => {
            el.className = 'w-8 h-8 rounded-full bg-gray-300 text-white flex items-center justify-center text-sm font-bold shadow';
        });

        if (statusText === 'รอดำเนินการ') {
            step1.className = 'w-8 h-8 rounded-full bg-[#d63b15] text-white flex items-center justify-center text-sm font-bold shadow';
        } else if (statusText === 'ดำเนินการ' || statusText === 'กำลังดำเนินการ') {
            step1.className = 'w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shadow';
            step2.className = 'w-8 h-8 rounded-full bg-[#d63b15] text-white flex items-center justify-center text-sm font-bold shadow';
        } else if (statusText === 'เสร็จสิ้น') {
            step1.className = 'w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shadow';
            step2.className = 'w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shadow';
            step3.className = 'w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shadow';
        }

        // แสดงการ์ดประวัติทั้งหมดของนักศึกษาคนนี้
        historyContainer.innerHTML = '';
        myRequests.forEach(item => {
            const itemStatus = statusMap[item.status] || item.status || 'รอดำเนินการ';
            const itemArea = areaMap[item.area] || item.area || '-';
            const itemDate = (item.createdAt || item.created_at || '').split('T')[0] || '-';

            const card = document.createElement('div');
            card.className = 'bg-white p-4 rounded-xl border border-[#c4ddf5] shadow-sm space-y-1';
            card.innerHTML = `
                <div class="flex justify-between text-sm text-gray-700">
                    <span>รหัสห้องพัก : <strong>${item.roomNumber || '-'}</strong></span>
                    <span class="text-xs text-gray-500">รหัสนศ. ${item.studentId || currentUser.username}</span>
                </div>
                <div class="text-sm text-gray-700">พื้นที่ : <strong>${itemArea}</strong> | รายการซ่อม : <strong>${item.repairItem || '-'}</strong></div>
                <div class="text-xs text-gray-500">รายละเอียด : ${item.description || '-'}</div>
                <div class="text-sm text-gray-600 pt-1">วันที่ : ${itemDate} | สถานะ : <span class="text-[#d63b15] font-semibold">${itemStatus}</span></div>
            `;
            historyContainer.appendChild(card);
        });

    } catch (err) {
        console.error('Fetch repair history error:', err);
        latestLoading.textContent = `ไม่สามารถโหลดข้อมูลสถานะได้ (${err.message})`;
        historyLoading.textContent = `ไม่สามารถโหลดประวัติได้ (${err.message})`;
        latestLoading.style.color = '#dc2626';
        historyLoading.style.color = '#dc2626';
    }
});