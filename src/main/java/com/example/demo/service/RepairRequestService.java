package com.example.demo.service;

import com.example.demo.RepairRequest;
import com.example.demo.dto.CreateRepairRequest;
import com.example.demo.repository.RepairRequestRepository;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
public class RepairRequestService {

    private static final Set<String> ALLOWED_AREAS = Set.of(
        "bedroom",
        "restroom",
        "centerpoint",
        "bathroom",
        "balcony",
        "key",
        "air"
    );

    private final RepairRequestRepository repository;

    public RepairRequestService(
            RepairRequestRepository repository) {

        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<RepairRequest> getAll() {

        return repository.findAll(
            Sort.by(
                Sort.Direction.DESC,
                "createdAt",
                "id"
            )
        );
    }

    @Transactional(readOnly = true)
    public RepairRequest getById(Long id) {

        return repository.findById(id)
            .orElseThrow(() ->
                new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "ไม่พบรายการแจ้งซ่อม"
                )
            );
    }

    @Transactional
    public RepairRequest create(CreateRepairRequest input) {

        String studentId = required(
            input.studentId(),
            10,
            "รหัสนักศึกษา"
        );

        String roomNumber = required(
            input.roomNumber(),
            20,
            "ห้อง"
        );

        String area = required(
            input.area(),
            30,
            "พื้นที่"
        );

        if (!ALLOWED_AREAS.contains(area)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "พื้นที่ที่เลือกไม่ถูกต้อง"
            );
        }

        String repairItem = required(
            input.repairItem(),
            200,
            "รายการซ่อม"
        );

        String description = input.description() == null
            ? ""
            : input.description().strip();

        if (description.length() > 150) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "รายละเอียดต้องไม่เกิน 150 ตัวอักษร"
            );
        }

        RepairRequest request = new RepairRequest(
            studentId,
            roomNumber,
            area,
            repairItem,
            description
        );

        return repository.save(request);
    }

    @Transactional
    public RepairRequest accept(Long id) {

        int updatedRows = repository.acceptPending(
            id,
            LocalDateTime.now()
        );

        if (updatedRows == 0) {
            getById(id);

            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "รายการนี้รับเรื่องแล้วหรือไม่อยู่ในสถานะรอรับเรื่อง"
            );
        }

        return getById(id);
    }

    private String required(
            String value,
            int maxLength,
            String fieldName) {

        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "กรุณากรอก" + fieldName
            );
        }

        String cleaned = value.strip();

        if (cleaned.length() > maxLength) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                fieldName + "ต้องไม่เกิน "
                    + maxLength + " ตัวอักษร"
            );
        }

        return cleaned;
    }
}