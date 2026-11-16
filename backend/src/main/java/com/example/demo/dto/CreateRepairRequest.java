package com.example.demo.dto;

// ไม่มี studentId เพราะ backend ใช้รหัสนักศึกษาจาก session ที่ login อยู่
public record CreateRepairRequest(
    String roomNumber,
    String area,
    String repairItem,
    String description
) {
}
