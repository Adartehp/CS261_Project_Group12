SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    username      VARCHAR(50)  NOT NULL,
    email         VARCHAR(100) NULL,
    password_hash VARCHAR(100) NULL,
    full_name     VARCHAR(150) NOT NULL,
    role          VARCHAR(20)  NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_username (username)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- บัญชีทดสอบเจ้าหน้าที่: username staff01 / password staff1234 (BCrypt)
-- นักศึกษาไม่ต้อง seed เพราะจะตรวจผ่าน TU API และบันทึกตอน login ครั้งแรก
INSERT INTO users (username, email, password_hash, full_name, role)
VALUES ('staff01', NULL, '$2a$10$P5.zySLgVKHDvb.AQWxFSeoOO5YywzoHfYx.p6Yv1WZFJhKHkv9qK', 'เจ้าหน้าที่หอพัก ทดสอบ', 'STAFF')
ON DUPLICATE KEY UPDATE username = username;
