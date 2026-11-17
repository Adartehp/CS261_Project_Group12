package com.example.demo.service;

import com.example.demo.RepairRequest;
import com.example.demo.dto.UpdateRepairRequestStatus;
import com.example.demo.repository.RepairRequestRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * US7: เจ้าหน้าที่เปลี่ยนสถานะคำร้อง
 *
 * ลำดับที่อนุญาต
 *   IN_PROGRESS -> DONE
 *   PENDING     -> CANCELLED
 *   IN_PROGRESS -> CANCELLED
 * ลำดับอื่นทั้งหมดต้องได้ 409 และสถานะในฐานข้อมูลต้องไม่เปลี่ยน
 */
@SpringBootTest
class RepairRequestStatusTransitionTest {

    private static final String STUDENT = "6609611111";

    @Autowired
    private RepairRequestService service;

    @Autowired
    private RepairRequestRepository repository;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
    }

    // ---------- ลำดับที่อนุญาต ----------

    @Test
    void inProgressToDoneSetsCompletedAtAndNote() {
        Long id = saveWithStatus("IN_PROGRESS");

        RepairRequest result = service.updateStatus(id, input("DONE", "  เปลี่ยนหลอดไฟแล้ว  "));

        assertEquals("DONE", result.getStatus());

        RepairRequest row = reload(id);
        assertEquals("DONE", row.getStatus());
        assertNotNull(row.getCompletedAt());
        assertEquals("เปลี่ยนหลอดไฟแล้ว", row.getStaffNote());
    }

    @Test
    void pendingToCancelledKeepsCompletedAtEmpty() {
        Long id = saveWithStatus("PENDING");

        service.updateStatus(id, input("CANCELLED", "นักศึกษาแจ้งซ้ำ"));

        RepairRequest row = reload(id);
        assertEquals("CANCELLED", row.getStatus());
        assertNull(row.getCompletedAt());
        assertEquals("นักศึกษาแจ้งซ้ำ", row.getStaffNote());
    }

    @Test
    void inProgressToCancelledKeepsCompletedAtEmpty() {
        Long id = saveWithStatus("IN_PROGRESS");

        service.updateStatus(id, input("CANCELLED", null));

        RepairRequest row = reload(id);
        assertEquals("CANCELLED", row.getStatus());
        assertNull(row.getCompletedAt());
        assertNull(row.getStaffNote());
    }

    @Test
    void statusIsCaseInsensitiveAndTrimmed() {
        Long id = saveWithStatus("IN_PROGRESS");

        service.updateStatus(id, input("  done ", null));

        assertEquals("DONE", reload(id).getStatus());
    }

    @Test
    void acceptThenDoneFollowsTheFullHappyPath() {
        Long id = saveWithStatus("PENDING");

        service.accept(id);
        service.updateStatus(id, input("DONE", null));

        RepairRequest row = reload(id);
        assertEquals("DONE", row.getStatus());
        assertNotNull(row.getAcceptedAt());
        assertNotNull(row.getCompletedAt());
    }

    // ---------- ลำดับที่ไม่อนุญาต (409) ----------

    @ParameterizedTest(name = "{0} -> {1} ได้ 409")
    @CsvSource({
        "PENDING,   DONE",
        "DONE,      DONE",
        "DONE,      CANCELLED",
        "CANCELLED, DONE",
        "CANCELLED, CANCELLED"
    })
    void forbiddenTransitionReturnsConflictAndChangesNothing(String from, String to) {
        Long id = saveWithStatus(from);

        ResponseStatusException error = assertThrows(
            ResponseStatusException.class,
            () -> service.updateStatus(id, input(to, "ไม่ควรถูกบันทึก"))
        );

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());

        RepairRequest row = reload(id);
        assertEquals(from, row.getStatus());
        assertNull(row.getStaffNote());
    }

    // ---------- ข้อมูลไม่ถูกต้อง (400 / 404) ----------

    @ParameterizedTest(name = "status \"{0}\" ได้ 400")
    @ValueSource(strings = {"PENDING", "IN_PROGRESS", "FINISHED", "", "   "})
    void statusOutsideDoneOrCancelledReturnsBadRequest(String status) {
        Long id = saveWithStatus("IN_PROGRESS");

        ResponseStatusException error = assertThrows(
            ResponseStatusException.class,
            () -> service.updateStatus(id, input(status, null))
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        assertEquals("IN_PROGRESS", reload(id).getStatus());
    }

    @Test
    void missingStatusReturnsBadRequest() {
        Long id = saveWithStatus("IN_PROGRESS");

        ResponseStatusException error = assertThrows(
            ResponseStatusException.class,
            () -> service.updateStatus(id, input(null, null))
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
    }

    @Test
    void noteLongerThan500CharactersReturnsBadRequestAndChangesNothing() {
        Long id = saveWithStatus("IN_PROGRESS");

        ResponseStatusException error = assertThrows(
            ResponseStatusException.class,
            () -> service.updateStatus(id, input("DONE", "ก".repeat(501)))
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());

        RepairRequest row = reload(id);
        assertEquals("IN_PROGRESS", row.getStatus());
        assertNull(row.getCompletedAt());
    }

    @Test
    void noteOfExactly500CharactersIsAccepted() {
        Long id = saveWithStatus("IN_PROGRESS");

        service.updateStatus(id, input("DONE", "ก".repeat(500)));

        assertEquals(500, reload(id).getStaffNote().length());
    }

    @Test
    void missingRequestReturnsNotFound() {
        ResponseStatusException error = assertThrows(
            ResponseStatusException.class,
            () -> service.updateStatus(999_999L, input("DONE", null))
        );

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
    }

    // ---------- helpers ----------

    private Long saveWithStatus(String status) {
        Long id = repository.save(new RepairRequest(
            STUDENT,
            "A-101",
            "bedroom",
            "หลอดไฟเสีย",
            "ไฟไม่ติด"
        )).getId();

        if (!"PENDING".equals(status)) {
            RepairRequest row = reload(id);
            row.updateStatus(status, null);
            repository.save(row);
        }

        return id;
    }

    private static UpdateRepairRequestStatus input(String status, String note) {
        return new UpdateRepairRequestStatus(status, note);
    }

    private RepairRequest reload(Long id) {
        return repository.findById(id).orElseThrow();
    }
}
