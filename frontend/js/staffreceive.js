document.addEventListener("DOMContentLoaded", async () => {
    const loadingEl = document.getElementById("loading-receive");
    const containerEl = document.getElementById("receive-container");

    // 1. ผูกปุ่มออกจากระบบไว้ก่อนเลย
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            if (confirm("คุณต้องการออกจากระบบหรือไม่?")) {
                if (typeof logout === "function") logout();
                else window.location.href = "index.html";
            }
        });
    }

    // 2. ดักการกดปุ่ม "กดรับเรื่อง" แบบ Event Delegation (กดติด 100%)
    document.addEventListener("click", async (e) => {
        const btn = e.target.closest(".accept-btn");
        if (!btn) return;

        const id = btn.getAttribute("data-id");
        if (!id) return;

        if (!confirm("ยืนยันการรับเรื่องรายการนี้ใช่หรือไม่?")) return;

        const originalHTML = btn.innerHTML;
        btn.disabled = true;
        btn.textContent = "กำลังรับเรื่อง...";

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

            const cardEl = document.getElementById(`req-card-${id}`);
            if (cardEl) cardEl.remove();

            if (containerEl && containerEl.children.length === 0) {
                containerEl.innerHTML = '<p class="text-center text-gray-500 py-6 font-medium">ไม่มีข้อมูล</p>';
            }
        } catch (err) {
            alert("เกิดข้อผิดพลาดในการรับเรื่อง: " + err.message);
            btn.disabled = false;
            btn.innerHTML = originalHTML;
        }
    });

    // 3. ตรวจสอบสิทธิ์และโหลดรายการ
    if (typeof requireAuth === "function") {
        const user = await requireAuth("STAFF");
        if (!user) return;
    }

    const areaMap = {
        bedroom: "ห้องนอน",
        restroom: "ห้องนั่งเล่น (เฉพาะโซน B)",
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

            const pendingList = list.filter(item =>
                !item.status || item.status === "PENDING" || item.status === "รอรับเรื่อง"
            );

            if (loadingEl) loadingEl.style.display = "none";
            if (containerEl) containerEl.style.display = "block";

            if (pendingList.length === 0) {
                containerEl.innerHTML = '<p class="text-center text-gray-500 py-6 font-medium">ไม่มีข้อมูล</p>';
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
                        <button type="button" class="accept-btn bg-[#d63b15] hover:bg-[#b82d0b] text-white px-5 py-2 rounded-xl text-sm font-semibold transition shadow-sm cursor-pointer" data-id="${item.id}">
                            <i class="fa-solid fa-check mr-1"></i> กดรับเรื่อง
                        </button>
                    </div>
                `;
                containerEl.appendChild(card);
            });
        } catch (err) {
            if (loadingEl) {
                loadingEl.textContent = `โหลดข้อมูลไม่สำเร็จ (${err.message})`;
                loadingEl.style.color = "#dc2626";
            }
        }
    }

    loadPendingRequests();
});