# ระบบแจ้งซ่อมหอพัก — CS261 กลุ่ม 12

เว็บแอปพลิเคชันสำหรับให้นักศึกษาส่งคำร้องแจ้งซ่อม และให้เจ้าหน้าที่ตรวจสอบรายละเอียดพร้อมรับเรื่อง โดยจัดเก็บข้อมูลใน MySQL

## ฟีเจอร์ปัจจุบัน (Demo 1)

- เลือกเข้าหน้านักศึกษาหรือเจ้าหน้าที่
- ส่งแจ้งซ่อมพร้อมรหัสนักศึกษา ห้อง พื้นที่ และรายละเอียด
- แสดงรายการและรายละเอียดคำร้อง
- รับเรื่องจากสถานะ `PENDING` เป็น `IN_PROGRESS` และป้องกันการรับเรื่องซ้ำ

การเลือกบทบาทยังไม่ใช่ระบบยืนยันตัวตนหรือควบคุมสิทธิ์ และยังไม่มีขั้นตอนปิดงานซ่อม

## เทคโนโลยี

| ส่วน | เทคโนโลยี | Container |
| --- | --- | --- |
| Frontend | HTML, CSS, JavaScript เสิร์ฟด้วย Nginx | `frontend` |
| Backend | Java, Spring Boot 4.1.1, Spring Data JPA | `backend` |
| ฐานข้อมูล | MySQL 8.4 | `db` |
| Build และรัน | Maven Wrapper, Docker Compose | |
| ทดสอบ | JUnit (H2), Postman | |

Nginx เป็นทางเข้าเว็บทางเดียว และส่งต่อ `/api/` ไปที่ backend ผ่าน network ภายในของ Docker โดย Maven กำหนด Java target เป็น 17 ส่วน Docker ใช้ Java 21

## โครงสร้างโฟลเดอร์

```
backend/    Spring Boot API และ Dockerfile
frontend/   หน้าเว็บ (HTML, css/, js/), nginx.conf และ Dockerfile
database/   Dockerfile ของ MySQL และ init/*.sql สำหรับสร้างตาราง
docs/       คู่มือ Docker และรายงานทดสอบ
postman/    Postman collection
```

## Branch Strategy

ใช้ Git Flow

- `main` เก็บเฉพาะเวอร์ชันที่ release แล้ว และติด tag เช่น `v1.0.0`
- `develop` ใช้รวมงานของทีม
- งานแต่ละชิ้นทำบน `feature/<us>-<ชื่อ>`, `bugfix/<ชื่อ>`, `release/vX.Y.Z` หรือ `hotfix/<ชื่อ>` แล้วเปิด Pull Request เข้า `develop`
- ห้าม push ลง `main` หรือ `develop` โดยตรง

## เริ่มใช้งาน

เปิด Docker Desktop แล้ว clone โปรเจกต์:

```bash
git clone https://github.com/Adartehp/CS261_Project_Group12.git
cd CS261_Project_Group12
```

สร้าง `.env` จาก `.env.example` แล้วตั้งรหัสผ่าน จากนั้นเปิดทั้ง 3 containers:

```bash
docker compose up -d --build
docker compose ps
```

รายละเอียดสำหรับ macOS และ Windows อยู่ใน [คู่มือ Docker](docs/docker.md)

เมื่อแอปพร้อม เปิด [หน้าแรก](http://localhost:18080/index.html), [หน้านักศึกษา](http://localhost:18080/student.html) หรือ [หน้าเจ้าหน้าที่](http://localhost:18080/staff.html)

## เอกสารและการทดสอบ

- [วิธีรันและจัดการ Docker](docs/docker.md)
- [รายงานทดสอบ Demo 1 ด้วยตนเอง](docs/demo1-test-report.md)
- [Postman collection](postman/demo1-backend.postman_collection.json) — ตั้ง `baseUrl` เป็น `http://localhost:18080` เมื่อทดสอบ Docker

ระหว่าง build image ของ backend จะรัน JUnit ด้วย ถ้า test ไม่ผ่าน build จะหยุด ไม่ commit `.env`, รหัสผ่านจริง หรือไฟล์ที่สร้างใน `target/`
