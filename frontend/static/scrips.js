
function selectRole(role) {
    if (role === 'student') {
        alert('คุณเลือกเข้าสู่ระบบสำหรับ: นักศึกษา');
    } else if (role === 'staff') {
        alert('คุณเลือกเข้าสู่ระบบสำหรับ: เจ้าหน้าที่');
    }
}

document.getElementById('menuToggle').addEventListener('click', function() {
    console.log('คลิกปุ่มเมนู');
});