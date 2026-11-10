CREATE TABLE IF NOT EXISTS repair_requests_demo1 (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    student_id  VARCHAR(20)  NOT NULL,
    room_number VARCHAR(20)  NOT NULL,
    area        VARCHAR(30)  NOT NULL,
    repair_item VARCHAR(200) NOT NULL,
    description VARCHAR(150) NULL,
    status      VARCHAR(30)  NOT NULL,
    created_at  DATETIME(6)  NOT NULL,
    updated_at  DATETIME(6)  NOT NULL,
    accepted_at DATETIME(6)  NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
