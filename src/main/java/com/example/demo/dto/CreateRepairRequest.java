package com.example.demo.dto;

public record CreateRepairRequest(
    String studentId,
    String roomNumber,
    String area,
    String repairItem,
    String description
) {  
}
