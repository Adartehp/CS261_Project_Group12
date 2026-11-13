# รันโปรเจกต์ด้วย Docker (3 containers)

ระบบแยกเป็น 3 containers และเปิดทั้งหมดได้ด้วย `docker compose` คำสั่งเดียว ไม่ต้องติดตั้ง Java, Maven หรือ MySQL บนเครื่อง

| Service | Build จาก | Image ฐาน | Port บนเครื่อง | หน้าที่ |
| --- | --- | --- | --- | --- |
| `frontend` | `frontend/` | `nginx:1.27-alpine` | `127.0.0.1:18080` → 80 | เสิร์ฟ HTML/CSS/JS และส่งต่อ `/api/` ไปที่ backend |
| `backend` | `backend/` | `eclipse-temurin:21-jre` | ไม่เปิดออกนอกเครื่อง | Spring Boot API (`/api/**`, `/actuator/health`) |
| `db` | `database/` | `mysql:8.4` | `127.0.0.1:3307` → 3306 | เก็บข้อมูลใน volume `mysql_data` และสร้างตารางจาก `database/init/*.sql` |

```
Browser ──► frontend (Nginx :80) ──/api/──► backend (Spring Boot :8080) ──► db (MySQL :3306)
```

ทั้ง 3 services อยู่บน network เดียวกันของ compose แต่ละตัวเรียกกันด้วยชื่อ service เช่น `backend` และ `db` ลำดับการเปิดถูกบังคับด้วย healthcheck คือ db ต้อง healthy ก่อน backend จะเริ่ม และ backend ต้อง healthy ก่อน frontend จะเริ่ม

## เตรียมเครื่อง

- **macOS:** ติดตั้ง Docker Desktop ให้ตรงกับชิปของเครื่อง (Apple silicon หรือ Intel) แล้วใช้ Terminal
- **Windows:** ติดตั้ง Git for Windows และ Docker Desktop (WSL 2, Linux containers) แล้วใช้ PowerShell หรือ Git Bash

เปิด Docker Desktop รอจนพร้อมใช้งาน แล้วตรวจ:

```bash
docker version
docker compose version
```

## เปิดระบบครั้งแรก

1. Clone repo แล้วเข้าโฟลเดอร์:

```bash
git clone https://github.com/Adartehp/CS261_Project_Group12.git
cd CS261_Project_Group12
```

2. สร้าง `.env` จากตัวอย่าง แล้วแก้ค่าหลัง `=` ของ `DOCKER_DB_PASSWORD` และ `DOCKER_ROOT_PASSWORD` เป็นรหัสของเครื่องตัวเอง

macOS/Linux:

```bash
cp -n .env.example .env
```

Windows PowerShell:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
notepad .env
```

บันทึกเป็นชื่อ `.env` ให้ตรง ไม่ใช่ `.env.txt` ห้าม commit ไฟล์นี้

3. Build และเปิดทั้ง 3 containers:

```bash
docker compose up -d --build
docker compose ps
```

ครั้งแรกใช้เวลาหลายนาทีเพราะต้องโหลด dependency ของ Maven และรัน test ระหว่าง build รอจนทั้ง 3 services ขึ้นสถานะ `healthy`

4. เปิด http://localhost:18080/

## ทดสอบใช้งาน

1. เปิด http://localhost:18080/student.html แล้วส่งคำร้องทดสอบ
2. เปิด http://localhost:18080/api/repair-requests เพื่อดูข้อมูล (ยังไม่มีคำร้องจะได้ `[]`)
3. เปิด http://localhost:18080/staff.html ดูรายละเอียดและทดลองรับเรื่อง

ใช้ [Postman collection](../postman/demo1-backend.postman_collection.json) โดยตั้งตัวแปร `baseUrl` เป็น `http://localhost:18080`

ระหว่าง build image ของ backend จะรัน JUnit บนฐานข้อมูล H2 ถ้า test ไม่ผ่าน build จะหยุด

## ฐานข้อมูล

- ตารางถูกสร้างจาก `database/init/01-schema.sql` เมื่อ volume ยังว่างเท่านั้น
- backend รันด้วย `DDL_AUTO=validate` คือ Hibernate ตรวจว่าตารางตรงกับ entity แต่ไม่สร้างหรือแก้ตารางเอง ถ้าเพิ่ม column ใน entity ต้องแก้ไฟล์ SQL ด้วย
- เชื่อมต่อจากเครื่องมือฐานข้อมูลบนเครื่องได้ที่ `127.0.0.1:3307` database `dormrepair` บัญชี `dormapp`

## หยุด เปิดใหม่ และอัปเดต

```bash
docker compose stop          # หยุด
docker compose start         # เปิด container เดิม
docker compose up -d --build # build ใหม่หลังแก้โค้ดหรือ pull งานใหม่
docker compose logs --tail 100 backend
```

ข้อมูลอยู่ใน volume `mysql_data` ใช้ `docker compose down` ได้ แต่ห้ามใส่ `-v` ถ้ายังต้องการข้อมูล

ถ้าแก้ไฟล์ใน `database/init/` ต้องล้าง volume ให้ script รันใหม่ (ข้อมูลเดิมจะหายทั้งหมด):

```bash
docker compose down -v
docker compose up -d --build
```

## ปัญหาที่พบบ่อย

| อาการ | สิ่งที่ตรวจ |
| --- | --- |
| `Set DOCKER_DB_PASSWORD in .env` | ยังไม่มี `.env` หรือยังไม่ได้ใส่ค่า |
| ติดต่อ Docker ไม่ได้ | เปิด Docker Desktop และรอให้พร้อม |
| Port 18080 หรือ 3307 ถูกใช้อยู่ | หยุด container ชุดเดิม (`docker stop group12-app group12-db`) หรือโปรแกรมที่ใช้ port นั้น |
| backend ไม่ healthy | `docker compose logs backend` ถ้าเจอ `Schema-validation` ให้ตรวจไฟล์ SQL หรือล้าง volume |
| Access denied | รหัสใน `.env` ไม่ตรงกับตอนสร้าง volume ครั้งแรก แก้ให้ตรงหรือ `docker compose down -v` |
| build บน Windows เจอ `\r` | `.gitattributes` บังคับ LF ให้ `mvnw`, `*.sh`, `*.sql`, `*.conf` แล้ว ให้ clone ใหม่ |
