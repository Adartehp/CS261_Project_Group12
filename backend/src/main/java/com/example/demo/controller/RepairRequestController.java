package com.example.demo.controller;

import com.example.demo.RepairRequest;
import com.example.demo.dto.CreateRepairRequest;
import com.example.demo.service.RepairRequestService;

import com.example.demo.dto.UpdateRepairRequest;
import com.example.demo.entity.User;
import com.example.demo.entity.User.Role;
import com.example.demo.service.AuthService;

import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/repair-requests")
public class RepairRequestController {

    private final RepairRequestService service;
    private final AuthService authService;

    public RepairRequestController(
            RepairRequestService service,
            AuthService authService) {

        this.service = service;
        this.authService = authService;
    }

    @GetMapping
    public List<RepairRequest> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public RepairRequest getById(
            @PathVariable Long id) {

        return service.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RepairRequest create(
            @RequestBody CreateRepairRequest request) {

        return service.create(request);
    }

  

    @PutMapping("/{id}")
    public RepairRequest update(
            @PathVariable Long id,
            @RequestBody UpdateRepairRequest body,
            Authentication authentication) {

        // 1. ดึง User จาก Session ที่ Login อยู่
        User user = authService.getUser(authentication.getName());

        // 2. อนุญาตเฉพาะนักศึกษา
        if (user.getRole() != Role.STUDENT) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "เฉพาะนักศึกษาเท่านั้นที่แก้ไขคำร้องได้"
            );
        }

        // 3. ตรวจสอบว่ามี studentId ในบัญชี
        if (user.getStudentId() == null
                || user.getStudentId().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "ไม่พบรหัสนักศึกษาในบัญชี"
            );
        }

        // 4. ส่งข้อมูลไปให้ Service แก้ไขคำร้อง
        return service.update(
                id,
                body,
                user.getStudentId()
        );
    }

    @PatchMapping("/{id}/accept")
    public RepairRequest accept(
            @PathVariable Long id) {

        return service.accept(id);
    }


}