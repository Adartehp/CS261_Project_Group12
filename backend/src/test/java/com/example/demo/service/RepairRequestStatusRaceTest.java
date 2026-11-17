package com.example.demo.service;

import com.example.demo.RepairRequest;
import com.example.demo.dto.UpdateRepairRequestStatus;
import com.example.demo.repository.RepairRequestRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * US7: การเปลี่ยนสถานะต้องไม่เขียนทับสิ่งที่อีกฝั่ง commit ไปแล้ว
 * ระหว่างที่ transaction ของเจ้าหน้าที่อ่านแถวไว้
 */
@SpringBootTest
class RepairRequestStatusRaceTest {

    private static final String OWNER = "6609611111";

    @Autowired
    private RepairRequestService service;

    @Autowired
    private RepairRequestRepository repository;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
    }

    @Test
    void staffCancelDoesNotUndoStudentEditThatCommittedAfterTheRead() {
        Long id = savePending();

        ResponseStatusException error = runStaffAfter(id, () ->
            repository.updatePendingDetails(
                id,
                OWNER,
                "B-205",
                "bathroom",
                "ก๊อกน้ำรั่ว",
                "น้ำหยดตลอดเวลา",
                LocalDateTime.now()
            ),
            new UpdateRepairRequestStatus("CANCELLED", "ยกเลิกตามคำขอ")
        );

        RepairRequest row = reload(id);
        assertEquals(null, error, "cancel of a pending request should succeed");
        assertEquals("CANCELLED", row.getStatus());
        assertEquals("B-205", row.getRoomNumber(),
            "student's edit was overwritten by the staff status change");
        assertEquals("ก๊อกน้ำรั่ว", row.getRepairItem());
    }

    @Test
    void secondStaffCannotCancelRequestThatAnotherStaffJustMarkedDone() {
        Long id = savePending();
        service.accept(id);

        ResponseStatusException error = runStaffAfter(id, () ->
            service.updateStatus(id, new UpdateRepairRequestStatus("DONE", "ซ่อมแล้ว")),
            new UpdateRepairRequestStatus("CANCELLED", "ยกเลิก")
        );

        RepairRequest row = reload(id);
        assertEquals("DONE", row.getStatus(),
            "a DONE request was turned into CANCELLED");
        assertNotNull(row.getCompletedAt());
        assertEquals("ซ่อมแล้ว", row.getStaffNote());

        assertNotNull(error, "the late status change must be rejected");
        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
    }

    /**
     * 1. transaction ของเจ้าหน้าที่อ่านแถวขึ้นมา
     * 2. อีกฝั่งทำ otherSide และ commit ก่อน
     * 3. เจ้าหน้าที่เปลี่ยนสถานะต่อใน transaction เดิม
     */
    private ResponseStatusException runStaffAfter(
            Long id,
            Runnable otherSide,
            UpdateRepairRequestStatus staffInput) {

        TransactionTemplate staffTx = new TransactionTemplate(transactionManager);
        TransactionTemplate otherTx = new TransactionTemplate(transactionManager);
        otherTx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        try {
            staffTx.executeWithoutResult(tx -> {
                repository.findById(id).orElseThrow();
                otherTx.executeWithoutResult(other -> otherSide.run());
                service.updateStatus(id, staffInput);
            });
            return null;
        } catch (ResponseStatusException e) {
            return e;
        }
    }

    private Long savePending() {
        return repository.save(new RepairRequest(
            OWNER,
            "A-101",
            "bedroom",
            "หลอดไฟเสีย",
            "ไฟไม่ติด"
        )).getId();
    }

    private RepairRequest reload(Long id) {
        return repository.findById(id).orElseThrow();
    }
}
