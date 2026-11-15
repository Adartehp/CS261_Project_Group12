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

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const rawData = await response.json();
        const allRequests = Array.isArray(rawData) ? rawData : (rawData.data || rawData.content || []);

        // กรองซ้ำฝั่ง Frontend เฉพาะรายการที่ studentId ตรงกับรหัสนักศึกษาที่ล็อกอิน
        const myRequests = allRequests.filter(item => String(item.studentId) === String(currentUser.username));

        latestLoading.style.display = 'none';
        historyLoading.style.display = 'none';
        latestContent.style.display = 'block';
        historyContainer.style.display = 'block';

        if (myRequests.length === 0) {
            latestContent.innerHTML = '<p class="text-center text-gray-500 py-2">ยังไม่มีรายการแจ้งซ่อมของคุณ</p>';
            historyContainer.innerHTML = '<p class="text-center text-gray-500 py-2">ยังไม่มีประวัติการแจ้งซ่อม</p>';
            return;
        }

        // รายการล่าสุด (ตัวแรกหรือตัวล่าสุดตามการเรียงของ API)
        const latest = myRequests[0];
        const rawDate = latest.createdAt || latest.created_at || '';
        const datePart = rawDate.includes('T') ? rawDate.split('T')[0] : (rawDate.split(' ')[0] || '-');
        const timePart = rawDate.includes('T') ? rawDate.split('T')[1].substring(0, 5) : (rawDate.split(' ')[1]?.substring(0, 5) || '-');

        document.getElementById('val-room').textContent = latest.roomNumber || '-';
        document.getElementById('val-date').textContent = datePart;
        document.getElementById('val-area').textContent = areaMap[latest.area] || latest.area || '-';
        document.getElementById('val-time').textContent = timePart;
        document.getElementById('val-repairItem').textContent = latest.repairItem || '-';

        // อัปเดต Progress Bar ให้ตรงกับสถานะจริงในระบบ ("รอรับเรื่อง" / "รับเรื่องแล้ว" / "เสร็จสิ้น")
        const statusText = latest.status || 'รอรับเรื่อง';
        const step1 = document.getElementById('step-1');
        const step2 = document.getElementById('step-2');
        const step3 = document.getElementById('step-3');

        [step1, step2, step3].forEach(el => {
            el.className = 'w-8 h-8 rounded-full bg-gray-300 text-white flex items-center justify-center text-sm font-bold shadow';
        });

        if (statusText === 'รอรับเรื่อง' || statusText === 'รอดำเนินการ' || statusText === 'PENDING') {
            step1.className = 'w-8 h-8 rounded-full bg-[#d63b15] text-white flex items-center justify-center text-sm font-bold shadow';
        } else if (statusText === 'รับเรื่องแล้ว' || statusText === 'ดำเนินการ' || statusText === 'กำลังดำเนินการ' || statusText === 'IN_PROGRESS') {
            step1.className = 'w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shadow';
            step2.className = 'w-8 h-8 rounded-full bg-[#d63b15] text-white flex items-center justify-center text-sm font-bold shadow';
        } else if (statusText === 'เสร็จสิ้น' || statusText === 'COMPLETED') {
            step1.className = 'w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shadow';
            step2.className = 'w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shadow';
            step3.className = 'w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shadow';
        }

        // แสดงการ์ดประวัติทั้งหมดเฉพาะของนักศึกษาคนนี้
        historyContainer.innerHTML = '';
        myRequests.forEach(item => {
            const itemArea = areaMap[item.area] || item.area || '-';
            const itemDate = (item.createdAt || item.created_at || '').split('T')[0] || '-';

            const card = document.createElement('div');
            card.className = 'bg-white p-4 rounded-xl border border-[#c4ddf5] shadow-sm space-y-1';
            card.innerHTML = `
                <div class="flex justify-between text-sm text-gray-700">
                    <span>รหัสห้องพัก : <strong>${item.roomNumber || '-'}</strong></span>
                    <span class="text-xs text-gray-500">รหัสนศ. ${item.studentId}</span>
                </div>
                <div class="text-sm text-gray-700">พื้นที่ : <strong>${itemArea}</strong> | รายการซ่อม : <strong>${item.repairItem || '-'}</strong></div>
                <div class="text-xs text-gray-500">รายละเอียด : ${item.description || '-'}</div>
                <div class="text-sm text-gray-600 pt-1">วันที่ : ${itemDate} | สถานะ : <span class="text-[#d63b15] font-semibold">${item.status || 'รอรับเรื่อง'}</span></div>
            `;
            historyContainer.appendChild(card);
        });

    } catch (err) {
        latestLoading.textContent = `ไม่สามารถโหลดข้อมูลสถานะได้ (${err.message})`;
        historyLoading.textContent = `ไม่สามารถโหลดประวัติได้ (${err.message})`;
        latestLoading.style.color = '#dc2626';
        historyLoading.style.color = '#dc2626';
    }

    // เพิ่มฟังก์ชันจัดรูปแบบวันเวลาใน studenthistory.js
function formatDateTime(isoString) {
    if (!isoString) return "-";
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString("th-TH", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit"
    }) + " น.";
}

// ในส่วนแสดงการ์ดประวัติ (myRequests.forEach) ให้แสดงเวลาแจ้งและเวลารับเรื่องเพิ่มเข้าไป:
myRequests.forEach(item => {
    const itemArea = areaMap[item.area] || item.area || '-';
    const createdTime = formatDateTime(item.createdAt);
    const acceptedTime = (item.status && item.status !== 'รอรับเรื่อง')
        ? formatDateTime(item.acceptedAt || item.updatedAt)
        : 'ยังไม่รับเรื่อง';

    const card = document.createElement('div');
    card.className = 'bg-white p-4 rounded-xl border border-[#c4ddf5] shadow-sm space-y-1.5';
    card.innerHTML = `
        <div class="flex justify-between text-sm text-gray-700">
            <span>รหัสห้องพัก : <strong>${item.roomNumber || '-'}</strong></span>
            <span class="text-xs text-gray-500">รหัสนศ. ${item.studentId}</span>
        </div>
        <div class="text-sm text-gray-700">พื้นที่ : <strong>${itemArea}</strong> | รายการซ่อม : <strong>${item.repairItem || '-'}</strong></div>
        <div class="text-xs text-gray-500">รายละเอียด : ${item.description || '-'}</div>
        <div class="text-xs text-gray-600 pt-1 border-t border-gray-100 space-y-0.5">
            <div>แจ้งเมื่อ : <strong>${createdTime}</strong></div>
            <div>รับเรื่องเมื่อ : <strong>${acceptedTime}</strong></div>
        </div>
        <div class="text-sm text-gray-600 pt-1">สถานะ : <span class="text-[#d63b15] font-semibold">${item.status || 'รอรับเรื่อง'}</span></div>
    `;
    historyContainer.appendChild(card);
});

});