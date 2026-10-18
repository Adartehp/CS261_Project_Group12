# รันโปรเจกต์ด้วย Docker

คำสั่ง Docker แบบบรรทัดเดียวในขั้นตอน 1–4 ใช้ได้ทั้ง Terminal บน macOS/Linux และ PowerShell บน Windows ให้เปิด Docker Desktop และรันจากโฟลเดอร์หลักของ repo ใช้ MySQL หนึ่ง container และ Spring Boot พร้อม Frontend อีกหนึ่ง container

Dockerfile build WAR ด้วย Maven แล้วรัน `java -jar` โดยใช้ Tomcat ที่มากับ Spring Boot ต่างจากตัวอย่างบทเรียนที่คัดลอก WAR เข้า Tomcat container แยก ไม่ต้องติดตั้ง Java หรือ Maven บนเครื่องสำหรับวิธีนี้

## Windows (PowerShell)

1. ติดตั้ง Git for Windows และ [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/) โดยเตรียม WSL 2 ตามคู่มือติดตั้ง
2. เปิด Docker Desktop โดยใช้ Linux containers เพราะ images ของโปรเจกต์เป็น Linux หากอยู่ในโหมด Windows containers ให้สลับเป็น Linux containers
3. เปิด **PowerShell** หรือเลือกโปรไฟล์ PowerShell ใน Windows Terminal คำสั่งในคู่มือนี้ไม่ได้เขียนสำหรับ Command Prompt (`cmd.exe`)
4. Clone แล้วเข้าโฟลเดอร์โปรเจกต์:

```powershell
git clone https://github.com/Adartehp/CS261_Project_Group12.git
cd CS261_Project_Group12
docker version
docker info --format '{{.OSType}}'
```

ควรเห็นทั้ง Client และ Server และคำสั่งสุดท้ายแสดง `linux` หากมี repo แล้ว ให้ใช้ `cd` เข้าโฟลเดอร์เดิม เช่น `cd "C:\Users\YourName\Projects\CS261_Project_Group12"` โดยเปลี่ยนเป็นตำแหน่งจริง

จากนั้นทำขั้นตอน **1–4 ด้านล่างได้เลย** รวมถึงคำสั่งหยุด เปิดใหม่ และอัปเดตแอป ใช้คำสั่งแต่ละบรรทัดตามที่ให้ไว้ ไม่เติม `\` ต่อท้ายแบบ shell บน macOS

เมื่อเปิดแอปสำเร็จ ให้เข้า http://localhost:18080/index.html ด้วย Browser บน Windows ส่วนการคัดลอก `.env` สำหรับ Compose ให้ใช้คำสั่ง PowerShell ในหัวข้อ Compose ด้านล่าง

repo มี `.gitattributes` บังคับให้ `mvnw` ใช้ line ending แบบ LF เพื่อให้สคริปต์ทำงานใน Linux build container แม้ clone จาก Windows หากพบ error มีอักขระ `\r` ตอน build ให้ตรวจว่า `mvnw` บันทึกเป็น LF แล้ว build ใหม่

## 1. สร้าง network และ volume

ทำครั้งแรก:

```bash
docker network create group12-network
docker volume create group12-mysql-data
```

หาก network มีอยู่แล้วใช้ตัวเดิมได้ ก่อนสร้าง container ตรวจ `docker ps -a` เพื่อไม่สร้างชื่อซ้ำ

## 2. เปิด MySQL

แทน `YOUR_ROOT_PASSWORD` และ `YOUR_APP_PASSWORD` ด้วยรหัสที่ตั้งเองก่อนรัน ตัวอย่างนี้สมมติว่ารหัสเป็นตัวอักษรอังกฤษและตัวเลข อย่าบันทึกรหัสจริงลงเอกสารใน Git

```bash
docker run -d --name group12-db --network group12-network -e MYSQL_ROOT_PASSWORD=YOUR_ROOT_PASSWORD -e MYSQL_DATABASE=dormrepair -e MYSQL_USER=dormapp -e MYSQL_PASSWORD=YOUR_APP_PASSWORD -p 127.0.0.1:3307:3306 -v group12-mysql-data:/var/lib/mysql mysql:8.4
docker logs --tail 80 group12-db
```

รอ `ready for connections` ที่พอร์ต 3306 การตั้งฐานข้อมูลและรหัสผ่านเกิดเมื่อเริ่มต้น volume ว่าง การเปลี่ยนค่าในคำสั่งไม่เปลี่ยนรหัสของฐานข้อมูลเดิม

| การเชื่อมต่อ | Host / Port |
| --- | --- |
| จากแอปใน Docker network | `group12-db:3306` |
| จากเครื่องมือฐานข้อมูลบนเครื่องผู้ใช้ | `127.0.0.1:3307` |

Database คือ `dormrepair` และบัญชีแอปคือ `dormapp` ข้อมูล MySQL เดิมบนเครื่องไม่ถูกคัดลอกเข้ามาอัตโนมัติ

## 3. Build และเปิดแอป

```bash
docker build -f Dockerfile -t group12-app-image .
```

เมื่อ build สำเร็จ ให้รันคำสั่งนี้โดยใช้ `YOUR_APP_PASSWORD` ค่าเดียวกับขั้นตอน 2:

```bash
docker run -d --name group12-app --network group12-network -p 127.0.0.1:18080:8080 -e 'DB_URL=jdbc:mysql://group12-db:3306/dormrepair?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Bangkok&characterEncoding=UTF-8' -e DB_USERNAME=dormapp -e DB_PASSWORD=YOUR_APP_PASSWORD group12-app-image
docker logs --tail 100 group12-app
```

เมื่อเห็น `Started DemoApplication` เปิด http://localhost:18080/index.html

## 4. ทดสอบใช้งาน

1. เปิด http://localhost:18080/student.html แล้วส่งคำร้องทดสอบ
2. เปิด http://localhost:18080/api/repair-requests เพื่อตรวจข้อมูล หากยังไม่มีคำร้องจะได้ `[]`
3. เปิด http://localhost:18080/staff.html ตรวจรายละเอียดและทดลองรับเรื่อง

Hibernate ใช้ `ddl-auto=update` สร้าง/ปรับตารางตาม entity ตารางคำร้องชื่อ `repair_requests_demo1` ไม่ต้องใช้ SQL ตัวอย่างสินค้าในบทเรียน

ใช้ [Postman collection](../postman/demo1-backend.postman_collection.json) โดยตั้งตัวแปร `baseUrl` เป็น `http://localhost:18080` ค่าเดิม `8080` ใช้สำหรับรันแอปนอก Docker

Dockerfile ใช้ `-DskipTests` จึงไม่ได้รัน automated tests ระหว่าง build ส่วนรายงานทดสอบเดิมเป็นผลทดสอบด้วยตนเองในวันที่ระบุ ไม่ใช่ผลทดสอบใหม่ของ Docker

## หยุดและเปิดใหม่

หยุด:

```bash
docker stop group12-app group12-db
```

เปิด Docker Desktop แล้วเริ่มฐานข้อมูล:

```bash
docker start group12-db
docker logs --tail 50 group12-db
```

รอฐานข้อมูลพร้อมก่อนรัน:

```bash
docker start group12-app
```

ข้อมูลอยู่ใน volume `group12-mysql-data` อย่าลบ volume หากยังต้องการข้อมูล

## อัปเดตหลังแก้โค้ด

Build image ใหม่ให้สำเร็จก่อน:

```bash
docker build -f Dockerfile -t group12-app-image .
```

จากนั้นเปลี่ยนเฉพาะ container แอป:

```bash
docker stop group12-app
docker rm group12-app
```

รันคำสั่งเปิดแอปในขั้นตอน 3 ใหม่ด้วยรหัสฐานข้อมูลเดิม ไม่ต้องลบฐานข้อมูล

## ทางเลือก: Docker Compose

ใช้แทนวิธีข้างบน ไม่รันพร้อมกันเพราะใช้พอร์ต 18080 และ 3307 เหมือนกัน ทั้งสองวิธีใช้ volume คนละชุด ข้อมูลไม่ย้ายข้ามกันอัตโนมัติ

หาก container วิธีหลักกำลังทำงาน ให้หยุดก่อน:

```bash
docker stop group12-app group12-db
```

สร้าง `.env` เฉพาะเมื่อยังไม่มีไฟล์ บน macOS/Linux:

```bash
cp -n .env.example .env
```

บน Windows PowerShell:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
notepad .env
```

แก้ไฟล์แล้วบันทึกชื่อ `.env` ให้ตรง ไม่ใช่ `.env.txt`

แก้ค่าหลัง `=` ของ `DOCKER_DB_PASSWORD` และ `DOCKER_ROOT_PASSWORD` ใน `.env` ให้เป็นรหัสของเครื่องตนเอง แล้วรัน:

```bash
docker compose up -d --build
docker compose ps
docker compose logs --tail 100 app
```

เปิดเว็บที่พอร์ต 18080 เหมือนเดิม ใช้ `docker compose stop` เพื่อหยุด และ `docker compose start` เพื่อเริ่ม container เดิม หากแก้โค้ดให้รัน `docker compose up -d --build` อีกครั้ง

ไม่ commit `.env` และไม่ใช้ `docker compose down -v` หากยังต้องการเก็บข้อมูล

## ปัญหาที่พบบ่อย

| อาการ | สิ่งที่ตรวจ |
| --- | --- |
| ติดต่อ Docker ไม่ได้ | เปิด Docker Desktop และรอให้พร้อม |
| ชื่อ container ซ้ำ | ตรวจ `docker ps -a`; ใช้ `docker start` หากเป็นตัวเดิม |
| Port ถูกใช้อยู่ | ตรวจ container หรือโปรแกรมที่ใช้ 3307 / 18080 |
| Access denied | ตรวจรหัสแอปให้ตรงกับบัญชีในฐานข้อมูลเดิม |
| แอปเชื่อม MySQL ไม่ได้ | รอ MySQL พร้อม ตรวจ network และใช้ hostname `group12-db` |
| แอปหยุดเอง | ตรวจ `docker logs --tail 100 group12-app` |
