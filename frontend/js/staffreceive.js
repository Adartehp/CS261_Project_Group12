document.addEventListener("DOMContentLoaded", async () => {
    const user = await requireAuth("STAFF");
    if (!user) return;

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            if (confirm("คุณต้องการออกจากระบบหรือไม่?")) logout();
        });
    }

    const loadingEl = document.getElementById("loading-receive");
    const containerEl = document.getElementById("receive-container");

    const areaMap = {
        bedroom: "ห้องนอน",
        restroom: "ห้องนั่งเล่น (โซน B)",
        centerpoint: "พื้นที่ส่วนกลาง",
        bathroom: "ห้องน้ำ",
        balcony: "ระเบียง+ลานซักผ้า",
        key: "รายการกุญแจ",
        air: "เครื่องปรับอากาศ (แอร์)"
    };

    function formatDateTime(isoString) {
        if (!isoString) return "-";
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return isoString;
        return d.toLocaleString("th-TH", {
            year: "numeric", month: "short", day: "numeric",
            hour: "2-digit", minute: "2-digit"
        }) + " น.";
    }

    async function loadPendingRequests() {
        try {
            const res = await fetch("/api/repair-requests", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin"
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const rawData = await res.json();
            const list = Array.isArray(rawData) ? rawData : (rawData.data || []);

            // กรองเฉพาะรายการที่ยังไม่ได้รับเรื่อง (สถานะ PENDING หรือ รอรับเรื่อง)
            const pendingList = list.filter(item =>
                !item.status || item.status === "PENDING" || item.status === "รอรับเรื่อง"
            );

            loadingEl.style.display = "none";
            containerEl.style.display = "block";

            if (pendingList.length === 0) {
                containerEl.innerHTML = '<p class="text-center text-gray-500 py-4">ไม่มีรายการรอรับเรื่องในขณะนี้</p>';
                return;
            }

            containerEl.innerHTML = "";
            pendingList.forEach(item => {
                const card = document.createElement("div");
                card.id = `req-card-${item.id}`;
                card.className = "bg-white p-5 rounded-xl border border-[#c4ddf5] shadow-sm space-y-2";
                card.innerHTML = `
                    <div class="flex justify-between text-sm text-gray-600">
                        <span>รหัสนักศึกษา : <strong>${item.studentId || "-"}</strong></span>
                        <span>ห้อง : <strong>${item.roomNumber || "-"}</strong></span>
                    </div>
                    <div class="text-sm text-gray-800">พื้นที่ : <strong>${areaMap[item.area] || item.area || "-"}</strong> | รายการซ่อม : <strong>${item.repairItem || "-"}</strong></div>
                    <div class="text-xs text-gray-500">รายละเอียด : ${item.description || "-"}</div>
                    <div class="text-xs text-blue-700 pt-1">
                        <i class="fa-regular fa-clock"></i> วันที่และเวลาที่แจ้ง : <strong>${formatDateTime(item.createdAt)}</strong>
                    </div>
                    <div class="pt-3 flex justify-end">
                        <button type="button" onclick="acceptRequest(${item.id})" class="bg-[#d63b15] hover:bg-[#b82d0b] text-white px-5 py-2 rounded-xl text-sm font-semibold transition shadow-sm">
                            <i class="fa-solid fa-check mr-1"></i> กดรับเรื่อง
                        </button>
                    </div>
                `;
                containerEl.appendChild(card);
            });
        } catch (err) {
            loadingEl.textContent = `โหลดข้อมูลไม่สำเร็จ (${err.message})`;
            loadingEl.style.color = "#dc2626";
        }
    }

    // แก้ไขให้เรียกใช้ PATCH /api/repair-requests/${id}/accept ตาม Backend ของโปรเจกต์
    window.acceptRequest = async function (id) {
        if (!confirm("ยืนยันการรับเรื่องรายการนี้ใช่หรือไม่?")) return;

        try {
            const res = await fetch(`/api/repair-requests/${id}/accept`, {
                method: "PATCH",
                credentials: "same-origin"
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => null);
                throw new Error(errData?.message || `HTTP ${res.status}`);
            }

            alert("รับเรื่องแจ้งซ่อมเรียบร้อยแล้ว");

            // ลบการ์ดออกจากหน้ารับเรื่องทันที
            const cardEl = document.getElementById(`req-card-${id}`);
            if (cardEl) cardEl.remove();

            if (containerEl.children.length === 0) {
                containerEl.innerHTML = '<p class="text-center text-gray-500 py-4">ไม่มีรายการรอรับเรื่องในขณะนี้</p>';
            }
        } catch (err) {
            alert("เกิดข้อผิดพลาดในการรับเรื่อง: " + err.message);
        }
    };

    loadPendingRequests();
});