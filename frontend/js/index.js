document.addEventListener("DOMContentLoaded", () => {
    document.documentElement.lang = "th";
    document.title = "ระบบแจ้งซ่อมหอพัก - เลือกผู้ใช้งาน";

    try {
        localStorage.removeItem("app_lang");
    } catch (e) {}

    const brandTitle = document.getElementById("brandTitle");
    const pageTitle = document.getElementById("pageTitle");
    const studentTitle = document.getElementById("studentTitle");
    const studentDesc = document.getElementById("studentDesc");
    const staffTitle = document.getElementById("staffTitle");
    const staffDesc = document.getElementById("staffDesc");

    if (brandTitle) brandTitle.textContent = "ระบบแจ้งซ่อมหอพัก";
    if (pageTitle) pageTitle.textContent = "เลือกผู้ใช้งาน";
    if (studentTitle) studentTitle.textContent = "นักศึกษา";
    if (studentDesc) studentDesc.textContent = "เข้าสู่ระบบสำหรับนักศึกษาผู้พักอาศัย";
    if (staffTitle) staffTitle.textContent = "เจ้าหน้าที่";
    if (staffDesc) staffDesc.textContent = "เข้าสู่ระบบสำหรับเจ้าหน้าที่หอพัก";
});