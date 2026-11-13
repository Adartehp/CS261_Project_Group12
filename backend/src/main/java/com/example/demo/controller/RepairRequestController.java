package com.example.demo.controller;

import com.example.demo.RepairRequest;
import com.example.demo.dto.CreateRepairRequest;
import com.example.demo.service.RepairRequestService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.format.annotation.DateTimeFormat;

import java.util.List;
import java.time.LocalDate;


@RestController
@RequestMapping("/api/repair-requests")
public class RepairRequestController {

    private final RepairRequestService service;

    public RepairRequestController(
            RepairRequestService service) {

        this.service = service;
    }

    @GetMapping
public List<RepairRequest> getAll(
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String area,
        @RequestParam(required = false) String room,
        @RequestParam(required = false) String studentId,
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        LocalDate from,
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        LocalDate to) {

    return service.getAll(
        status,
        area,
        room,
        studentId,
        from,
        to
    );
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

    @PatchMapping("/{id}/accept")
    public RepairRequest accept(
            @PathVariable Long id) {

        return service.accept(id);
    }
}