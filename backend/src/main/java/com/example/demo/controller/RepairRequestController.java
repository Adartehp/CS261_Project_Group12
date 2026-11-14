package com.example.demo.controller;

import com.example.demo.RepairRequest;
import com.example.demo.dto.CreateRepairRequest;
import com.example.demo.service.RepairRequestService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.security.Principal;
import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/api/repair-requests")
public class RepairRequestController {

    private final RepairRequestService service;

    public RepairRequestController(
            RepairRequestService service) {

        this.service = service;
    }

    @GetMapping
    public List<RepairRequest> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public RepairRequest getById(
        @PathVariable Long id,
        Principal principal,
        Authentication authentication) {

    RepairRequest request = service.getById(id);

    // ตรวจสอบว่าเป็นนักศึกษาหรือไม่
    boolean isStudent = authentication != null &&
        authentication.getAuthorities().stream()
            .anyMatch(authority ->
                authority.getAuthority().equals("ROLE_STUDENT") ||
                authority.getAuthority().equals("STUDENT")
            );

    // ถ้าเป็นนักศึกษา ต้องดูได้เฉพาะรายการของตัวเอง
    if (isStudent &&
            (principal == null ||
            !java.util.Objects.equals(
                request.getStudentId(),
                principal.getName()
            ))) {

            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "ไม่พบรายการแจ้งซ่อม"
            );
        }

    return request;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RepairRequest create(
            @RequestBody CreateRepairRequest request) {

        return service.create(request);
    }

    @PatchMapping("/{id}/accept")
    public RepairRequest accept(
            @PathVariable Long id) {

        return service.accept(id);
    }


    @GetMapping("/mine")
    public List<RepairRequest> getMine(
        Principal principal,

        @RequestParam(required = false)
        String status,

        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        LocalDate from,

        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        LocalDate to) {

    // ตรวจสอบว่ามีผู้ใช้งาน Login หรือไม่
    if (principal == null ||
        principal.getName() == null ||
        principal.getName().isBlank()) {

        throw new ResponseStatusException(
            HttpStatus.FORBIDDEN,
            "กรุณาเข้าสู่ระบบก่อน"
        );
    }

    // ใช้ studentId จาก Authentication
    return service.getMine(
        principal.getName(),
        status,
        from,
        to
    );
    }
}