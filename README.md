# ระบบแจ้งซ่อมหอพัก — CS261 กลุ่ม 12

เว็บแอปพลิเคชันสำหรับให้นักศึกษาส่งคำร้องแจ้งซ่อม และให้เจ้าหน้าที่ตรวจสอบรายละเอียดพร้อมรับเรื่อง โดยจัดเก็บข้อมูลใน MySQL

## ฟีเจอร์ปัจจุบัน (Demo 1)

- เลือกเข้าหน้านักศึกษาหรือเจ้าหน้าที่
- ส่งแจ้งซ่อมพร้อมรหัสนักศึกษา ห้อง พื้นที่ และรายละเอียด
- แสดงรายการและรายละเอียดคำร้อง
- รับเรื่องจากสถานะ `PENDING` เป็น `IN_PROGRESS` และป้องกันการรับเรื่องซ้ำ

การเลือกบทบาทยังไม่ใช่ระบบยืนยันตัวตนหรือควบคุมสิทธิ์ และยังไม่มีขั้นตอนปิดงานซ่อม

## เทคโนโลยี

| ส่วน | เทคโนโลยี |
| --- | --- |
| Backend | Java, Spring Boot 4.1.1, Spring Data JPA |
| Frontend | HTML, CSS, JavaScript |
| ฐานข้อมูล | MySQL 8.4 |
| Build และรัน | Maven Wrapper, Docker |
| ทดสอบ API | Postman |

Frontend อยู่ใน `src/main/resources/static` และรันผ่าน Spring Boot ไม่ต้องมี Node.js container แยก โดย Maven กำหนด Java target เป็น 17 ส่วน Docker ใช้ Java 21

## เริ่มใช้งาน

เปิด Docker Desktop แล้ว clone โปรเจกต์:

```bash
git clone https://github.com/Adartehp/CS261_Project_Group12.git
cd CS261_Project_Group12
```

ทำตาม [คู่มือ Docker](docs/docker.md) เพื่อสร้าง network, เปิด MySQL และ build/run แอปตามแนวทางบทเรียน คู่มือมี Docker Compose เป็นทางเลือกด้วย

รองรับ macOS/Linux และ [Windows ด้วย PowerShell](docs/docker.md#windows-powershell)

เมื่อแอปพร้อม เปิด [หน้าแรก](http://localhost:18080/index.html), [หน้านักศึกษา](http://localhost:18080/student.html) หรือ [หน้าเจ้าหน้าที่](http://localhost:18080/staff.html)

## เอกสารและการทดสอบ

- [วิธีรันและจัดการ Docker](docs/docker.md)
- [รายงานทดสอบ Demo 1 ด้วยตนเอง](docs/demo1-test-report.md)
- [Postman collection](postman/demo1-backend.postman_collection.json) — ตั้ง `baseUrl` เป็น `http://localhost:18080` เมื่อทดสอบ Docker

Docker build ข้าม tests จึงควรทดลองส่งคำร้อง ตรวจรายการ และรับเรื่องหลังเปิดระบบ ไม่ commit `.env`, รหัสผ่านจริง หรือไฟล์ที่สร้างใน `target/`
