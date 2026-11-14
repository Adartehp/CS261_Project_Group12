package com.example.demo.dto;

public record UpdateRepairRequest(
    String roomNumber, //หมายเลขห้อง
    String area, //พื้นที่ที่ต้องการซ่อม
    String repairItem, //รายการที่ต้องการซ่อม
    String description //รายละเอียดเพิ่มเติม
) {}