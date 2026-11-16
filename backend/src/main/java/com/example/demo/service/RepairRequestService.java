package com.example.demo.service;

import com.example.demo.RepairRequest;
import com.example.demo.dto.CreateRepairRequest;
import com.example.demo.dto.UpdateRepairRequest;
import com.example.demo.repository.RepairRequestRepository;
import com.example.demo.dto.UpdateRepairRequestStatus;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.time.LocalDate;
import java.util.Locale;



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
    public List<RepairRequest> getAll(
            String status,
            String area,
            String room,
            String studentId,
            LocalDate from,
            LocalDate to) {

        if (from != null && to != null && from.isAfter(to)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด"
            );
        }

        String cleanStatus = status == null || status.isBlank()
            ? null : status.strip().toUpperCase(Locale.ROOT);

        String cleanArea = area == null || area.isBlank()
            ? null : area.strip().toLowerCase(Locale.ROOT);

        String cleanRoom = room == null || room.isBlank()
            ? null : room.strip();

        String cleanStudentId = studentId == null || studentId.isBlank()
            ? null : studentId.strip();

        LocalDateTime fromDate = from == null
            ? null : from.atStartOfDay();

        LocalDateTime toDate = to == null
            ? null : to.plusDays(1).atStartOfDay();

        return repository.findFiltered(
            cleanStatus,
            cleanArea,
            cleanRoom,
            cleanStudentId,
            fromDate,
            toDate,
            Sort.by(
                Sort.Direction.DESC,
                "createdAt",
                "id"
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
    @Transactional
    public RepairRequest updateStatus(
            Long id,
            UpdateRepairRequestStatus input) {

        RepairRequest request = getById(id);
        String current = request.getStatus();

        if (input == null || input.status() == null) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "กรุณาระบุสถานะ"
            );
        }

        String newStatus = input.status().strip().toUpperCase();

        if (!newStatus.equals("DONE")
                && !newStatus.equals("CANCELLED")) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "สถานะต้องเป็น DONE หรือ CANCELLED เท่านั้น"
            );
        }

        boolean ok =("DONE".equals(newStatus) && "IN_PROGRESS".equals(current))
        || ("CANCELLED".equals(newStatus) && Set.of("PENDING", "IN_PROGRESS").contains(current));

        if (!ok) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "ไม่สามารถเปลี่ยนสถานะนี้ได้"
            );
        }

        String staffNote = input.staffNote();

        if (staffNote != null) {
            staffNote = staffNote.strip();

            if (staffNote.length() > 500) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "หมายเหตุต้องไม่เกิน 500 ตัวอักษร"
                );
            }
        }

        request.updateStatus(newStatus, staffNote);

        return repository.save(request);
    }


    @Transactional
    public RepairRequest update(Long id, UpdateRepairRequest input,String currentStudentId) {

        // 1. ค้นหาคำร้อง
        RepairRequest request = repository.findById(id)
                    .orElseThrow(() ->
                            new ResponseStatusException(
                                    HttpStatus.NOT_FOUND,
                                    "ไม่พบรายการแจ้งซ่อม"
                            )
                    );

        // 2. ตรวจสอบเจ้าของคำร้อง
        if (!request.getStudentId().equals(currentStudentId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "ไม่มีสิทธิ์แก้ไขรายการแจ้งซ่อมนี้"
            );
        }

        // 3. ตรวจสอบสถานะ
        if (!"PENDING".equals(request.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "ไม่สามารถแก้ไขรายการที่รับเรื่องแล้ว"
            );
        }

        // 4. ตรวจสอบข้อมูลเหมือนตอน POST
        String roomNumber = required(
                input.roomNumber(), 20, "ห้อง"
        );

        String area = required(
                input.area(), 30, "พื้นที่"
        );

        if (!ALLOWED_AREAS.contains(area)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "พื้นที่ที่เลือกไม่ถูกต้อง"
            );
        }

        String repairItem = required(
                input.repairItem(), 200, "รายการซ่อม"
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

        // 5. แก้ไขข้อมูล
        request.updateDetails(
                roomNumber,
                area,
                repairItem,
                description
        );

        // 6. บันทึก
        return repository.save(request);
    }

    @Transactional(readOnly = true)
    public List<RepairRequest> getMine(
        String studentId,
        String status,
        LocalDate from,
        LocalDate to) {

    if (studentId == null || studentId.isBlank()) {
        throw new ResponseStatusException(
            HttpStatus.FORBIDDEN,
            "ไม่พบข้อมูลนักศึกษาที่เข้าสู่ระบบ"
        );
    }

    String cleanedStatus = null;

    if (status != null && !status.isBlank()) {

        cleanedStatus = status.strip().toUpperCase();

        if (!Set.of(
            "PENDING",
            "IN_PROGRESS",
            "DONE",
            "CANCELLED"
        ).contains(cleanedStatus)) {

        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "สถานะไม่ถูกต้อง"
            );
        }
    }

    // ตรวจสอบช่วงวันที่
    if (from != null && to != null && from.isAfter(to)) {
        throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด"
        );
    }

    LocalDateTime fromDate = from == null
        ? null
        : from.atStartOfDay();

    LocalDateTime toDateExclusive = to == null
        ? null
        : to.plusDays(1).atStartOfDay();

    // ค้นหาเฉพาะรายการของนักศึกษาคนนี้
    return repository.findMine(
        studentId.strip(),
        cleanedStatus,
        fromDate,
        toDateExclusive
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


