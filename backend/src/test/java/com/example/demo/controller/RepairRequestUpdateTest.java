package com.example.demo.controller;

import com.example.demo.RepairRequest;
import com.example.demo.dto.UpdateRepairRequest;
import com.example.demo.entity.User;
import com.example.demo.repository.RepairRequestRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.RepairRequestService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * US4: นักศึกษาแก้ไขคำร้องของตัวเองได้เฉพาะตอนที่ยังเป็น PENDING
 */
@SpringBootTest
@AutoConfigureMockMvc
class RepairRequestUpdateTest {

    private static final String OWNER = "6609611111";
    private static final String OTHER_STUDENT = "6609622222";

    private static final String EDIT_BODY = """
        {
            "roomNumber": "B-205",
            "area": "bathroom",
            "repairItem": "ก๊อกน้ำรั่ว",
            "description": "น้ำหยดตลอดเวลา"
        }
        """;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RepairRequestService service;

    @Autowired
    private RepairRequestRepository repairRequestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @BeforeEach
    void setUp() {
        repairRequestRepository.deleteAll();
        userRepository.deleteAll();

        userRepository.save(User.student(OWNER, "owner@test.com", "Owner"));
        userRepository.save(User.student(OTHER_STUDENT, "other@test.com", "Other"));
    }

    @Test
    void ownerCanEditPendingRequestAndItStaysPending() throws Exception {
        Long id = savePendingRequestOf(OWNER);

        mockMvc.perform(put("/api/repair-requests/" + id)
                .with(user(OWNER).roles("STUDENT"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(EDIT_BODY))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("PENDING"))
            .andExpect(jsonPath("$.roomNumber").value("B-205"));

        RepairRequest row = reload(id);
        assertEquals("B-205", row.getRoomNumber());
        assertEquals("bathroom", row.getArea());
        assertEquals("ก๊อกน้ำรั่ว", row.getRepairItem());
        assertEquals("น้ำหยดตลอดเวลา", row.getDescription());
        assertEquals("PENDING", row.getStatus());
        assertNull(row.getAcceptedAt());
    }

    @Test
    void editAfterStaffAcceptedReturnsConflictAndChangesNothing() throws Exception {
        Long id = savePendingRequestOf(OWNER);
        service.accept(id);

        mockMvc.perform(put("/api/repair-requests/" + id)
                .with(user(OWNER).roles("STUDENT"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(EDIT_BODY))
            .andExpect(status().isConflict());

        assertUnchangedDetails(reload(id));
        assertEquals("IN_PROGRESS", reload(id).getStatus());
    }

    @Test
    void otherStudentCannotEditRequest() throws Exception {
        Long id = savePendingRequestOf(OWNER);

        mockMvc.perform(put("/api/repair-requests/" + id)
                .with(user(OTHER_STUDENT).roles("STUDENT"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(EDIT_BODY))
            .andExpect(status().isForbidden());

        assertUnchangedDetails(reload(id));
        assertEquals("PENDING", reload(id).getStatus());
    }

    @Test
    void editOfMissingRequestReturnsNotFound() throws Exception {
        mockMvc.perform(put("/api/repair-requests/999999")
                .with(user(OWNER).roles("STUDENT"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(EDIT_BODY))
            .andExpect(status().isNotFound());
    }

    /**
     * Race: transaction ของนักศึกษาอ่านแถวตอนยังเป็น PENDING
     * แล้วเจ้าหน้าที่รับเรื่องและ commit ก่อนที่การแก้ไขจะบันทึก
     * การแก้ไขต้องไม่เขียน status/accepted_at ทับการรับเรื่อง
     */
    @Test
    void editCannotUndoAcceptanceThatCommittedAfterEditReadTheRow() {
        Long id = savePendingRequestOf(OWNER);

        TransactionTemplate studentTx = new TransactionTemplate(transactionManager);
        TransactionTemplate staffTx = new TransactionTemplate(transactionManager);
        staffTx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        ResponseStatusException error = null;
        try {
            studentTx.executeWithoutResult(tx -> {
                // 1. ฝั่งนักศึกษาอ่านแถวขณะที่ยังเป็น PENDING
                repairRequestRepository.findById(id).orElseThrow();

                // 2. เจ้าหน้าที่รับเรื่องใน transaction ของตัวเองและ commit ก่อน
                staffTx.executeWithoutResult(staff ->
                    repairRequestRepository.acceptPending(id, LocalDateTime.now()));

                // 3. การแก้ไขของนักศึกษาทำต่อใน transaction เดิมที่เห็น PENDING
                service.update(id, editInput(), OWNER);
            });
        } catch (ResponseStatusException e) {
            error = e;
        }

        RepairRequest row = reload(id);
        assertEquals("IN_PROGRESS", row.getStatus(),
            "staff acceptance was overwritten by the student's edit");
        assertNotNull(row.getAcceptedAt(),
            "accepted_at was cleared by the student's edit");
        assertUnchangedDetails(row);

        assertNotNull(error, "edit of an accepted request must be rejected");
        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
    }

    private Long savePendingRequestOf(String studentId) {
        return repairRequestRepository.save(new RepairRequest(
            studentId,
            "A-101",
            "bedroom",
            "หลอดไฟเสีย",
            "ไฟไม่ติด"
        )).getId();
    }

    private static void assertUnchangedDetails(RepairRequest row) {
        assertEquals("A-101", row.getRoomNumber());
        assertEquals("bedroom", row.getArea());
        assertEquals("หลอดไฟเสีย", row.getRepairItem());
        assertEquals("ไฟไม่ติด", row.getDescription());
    }

    private static UpdateRepairRequest editInput() {
        return new UpdateRepairRequest(
            "B-205",
            "bathroom",
            "ก๊อกน้ำรั่ว",
            "น้ำหยดตลอดเวลา"
        );
    }

    private RepairRequest reload(Long id) {
        return repairRequestRepository.findById(id).orElseThrow();
    }
}
