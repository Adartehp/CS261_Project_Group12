document.addEventListener("DOMContentLoaded", () => {
    const langTH = document.getElementById("langTH");
    const langEN = document.getElementById("langEN");
    const brandTitle = document.getElementById("brandTitle");
    const pageTitle = document.getElementById("pageTitle");
    const studentTitle = document.getElementById("studentTitle");
    const studentDesc = document.getElementById("studentDesc");
    const staffTitle = document.getElementById("staffTitle");
    const staffDesc = document.getElementById("staffDesc");

    const translations = {
        th: {
            docTitle: "ระบบแจ้งซ่อมหอพัก - เลือกผู้ใช้งาน",
            brandTitle: "ระบบแจ้งซ่อมหอพัก",
            pageTitle: "เลือกผู้ใช้งาน",
            studentTitle: "นักศึกษา",
            studentDesc: "เข้าสู่ระบบสำหรับนักศึกษาผู้พักอาศัย",
            staffTitle: "เจ้าหน้าที่",
            staffDesc: "เข้าสู่ระบบสำหรับเจ้าหน้าที่หอพัก"
        },
        en: {
            docTitle: "Dormitory Repair System - Select Role",
            brandTitle: "Dormitory Repair System",
            pageTitle: "Select User Role",
            studentTitle: "Student",
            studentDesc: "Login for resident students",
            staffTitle: "Staff",
            staffDesc: "Login for dormitory staff"
        }
    };

    function setLanguage(lang) {
        const t = translations[lang] || translations.th;
        document.documentElement.lang = lang;
        document.title = t.docTitle;

        if (brandTitle) brandTitle.textContent = t.brandTitle;
        if (pageTitle) pageTitle.textContent = t.pageTitle;
        if (studentTitle) studentTitle.textContent = t.studentTitle;
        if (studentDesc) studentDesc.textContent = t.studentDesc;
        if (staffTitle) staffTitle.textContent = t.staffTitle;
        if (staffDesc) staffDesc.textContent = t.staffDesc;

        if (lang === "en") {
            if (langEN) langEN.classList.add("active");
            if (langTH) langTH.classList.remove("active");
        } else {
            if (langTH) langTH.classList.add("active");
            if (langEN) langEN.classList.remove("active");
        }

        try {
            localStorage.setItem("app_lang", lang);
        } catch (e) {}
    }

    if (langTH) {
        langTH.addEventListener("click", () => setLanguage("th"));
    }

    if (langEN) {
        langEN.addEventListener("click", () => setLanguage("en"));
    }

    // โหลดภาษาที่เคยเลือกไว้
    let savedLang = "th";
    try {
        savedLang = localStorage.getItem("app_lang") || "th";
    } catch (e) {}

    setLanguage(savedLang);
});
