/**
 * auth.js - Helper สำหรับจัดการระบบตรวจสอบตัวตนและ Session (Task 29)
 */

/**
 * ดึงข้อมูลผู้ใช้ที่ล็อกอินอยู่จาก Backend API (/api/auth/me) หรือ Session Fallback สำหรับโหมดพรีวิว
 * @returns {Promise<{username: string, fullName: string, role: string}|null>}
 */
async function getCurrentUser() {
    try {
        const response = await fetch("/api/auth/me", {
            method: "GET",
            credentials: "same-origin"
        });
        if (response.ok) {
            const data = await response.json();
            sessionStorage.setItem("currentUser", JSON.stringify(data));
            return data;
        }
    } catch (error) {
        // เงียบข้อผิดพลาดไว้สำหรับกรณีไม่มี Backend API ในโหมดพรีวิว
    }

    // Fallback: ดึงจาก sessionStorage กรณีรันบนพรีวิว / ไม่มี Backend เชื่อมต่อ
    const stored = sessionStorage.getItem("currentUser");
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            sessionStorage.removeItem("currentUser");
        }
    }

    return null;
}

/**
 * ตรวจสอบสิทธิ์การเข้าถึงหน้าเว็บ (Authentication Guard)
 * หากยังไม่ได้ล็อกอินจะนำทางไปยังหน้า Login ที่เหมาะสม
 * @param {"STUDENT"|"STAFF"} requiredRole - บทบาทที่ต้องการ
 * @returns {Promise<{username: string, fullName: string, role: string}|null>}
 */
async function requireAuth(requiredRole) {
    const user = await getCurrentUser();
    if (!user) {
        if (requiredRole === "STAFF") {
            window.location.href = "stafflogin.html";
        } else {
            window.location.href = "studentlogin.html";
        }
        return null;
    }

    if (requiredRole && user.role !== requiredRole) {
        alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
        if (user.role === "STUDENT") {
            window.location.href = "studentselect.html";
        } else if (user.role === "STAFF") {
            window.location.href = "staff.html";
        } else {
            window.location.href = "index.html";
        }
        return null;
    }

    return user;
}

/**
 * ออกจากระบบ (Logout)
 */
async function logout() {
    try {
        await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "same-origin"
        });
    } catch (error) {
        console.error("Error during logout:", error);
    } finally {
        sessionStorage.removeItem("currentUser");
        window.location.href = "index.html";
    }
}

/**
 * แปลงอักขระพิเศษของ HTML ก่อนนำข้อความที่ผู้ใช้กรอกไปใส่ใน innerHTML
 * เพื่อไม่ให้แท็กหรือสคริปต์ที่แฝงมาในข้อความทำงานบนหน้าเว็บ (ป้องกัน XSS)
 * @param {*} value
 * @returns {string}
 */
function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
