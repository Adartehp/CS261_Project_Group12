package com.example.demo.controller;

import com.example.demo.RepairRequest;
import com.example.demo.repository.RepairRequestRepository;
import com.example.demo.service.RepairRequestService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.time.LocalDate;

import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * US3, US9: นักศึกษาดูสถานะและประวัติคำร้องของตัวเอง
 * GET /api/repair-requests/mine และ GET /api/repair-requests/{id}
 */
@SpringBootTest
@AutoConfigureMockMvc
class StudentMineTest {

    private static final String MINE = "/api/repair-requests/mine";
    private static final String ME = "6609611111";
    private static final String OTHER = "6609622222";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RepairRequestRepository repository;

    @Autowired
    private RepairRequestService service;

    private Long myPending;
    private Long myAccepted;
    private Long myDone;
    private Long otherRequest;

    @BeforeEach
    void setUp() {
        repository.deleteAll();

        myPending = save(ME, "bedroom", "PENDING");
        myAccepted = save(ME, "bathroom", "IN_PROGRESS");
        myDone = save(ME, "air", "DONE");
        otherRequest = save(OTHER, "key", "PENDING");
    }

    // ---------- US3 TC01 / US9 TC01: เห็นเฉพาะของตัวเอง พร้อมสถานะ ----------

    @Test
    void mineReturnsOnlyMyRequestsNewestFirst() throws Exception {
        mockMvc.perform(get(MINE).with(me()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(3)))
            .andExpect(jsonPath("$[*].studentId", everyItem(is(ME))))
            .andExpect(jsonPath("$[0].id").value(myDone))
            .andExpect(jsonPath("$[2].id").value(myPending))
            .andExpect(jsonPath("$[0].status").value("DONE"))
            .andExpect(jsonPath("$[0].createdAt", notNullValue()));
    }

    @Test
    void otherStudentSeesOnlyTheirOwnRequest() throws Exception {
        mockMvc.perform(get(MINE).with(user(OTHER).roles("STUDENT")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].id").value(otherRequest));
    }

    @Test
    void studentWithNoRequestsGetsEmptyList() throws Exception {
        mockMvc.perform(get(MINE).with(user("6609699999").roles("STUDENT")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(0)));
    }

    // ---------- US3 TC02: รายละเอียดมีเวลาที่เจ้าหน้าที่รับเรื่อง ----------

    @Test
    void myAcceptedRequestShowsAcceptedTime() throws Exception {
        mockMvc.perform(get("/api/repair-requests/" + myAccepted).with(me()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("IN_PROGRESS"))
            .andExpect(jsonPath("$.acceptedAt", notNullValue()));
    }

    @Test
    void myPendingRequestHasNoAcceptedTimeYet() throws Exception {
        mockMvc.perform(get("/api/repair-requests/" + myPending).with(me()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.acceptedAt", nullValue()));
    }

    @Test
    void studentCannotOpenAnotherStudentsRequest() throws Exception {
        mockMvc.perform(get("/api/repair-requests/" + otherRequest).with(me()))
            .andExpect(status().isNotFound());
    }

    @Test
    void staffCanOpenAnyRequest() throws Exception {
        mockMvc.perform(get("/api/repair-requests/" + otherRequest).with(user("staff01").roles("STAFF")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.studentId").value(OTHER));
    }

    // ---------- US9 TC02: กรองตามสถานะและช่วงวันที่ ----------

    @Test
    void filterByStatusIsCaseInsensitive() throws Exception {
        mockMvc.perform(get(MINE).param("status", "done").with(me()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].id").value(myDone));
    }

    @Test
    void filterByStatusNeverLeaksOtherStudents() throws Exception {
        mockMvc.perform(get(MINE).param("status", "PENDING").with(me()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].id").value(myPending));
    }

    @Test
    void unknownStatusGets400() throws Exception {
        mockMvc.perform(get(MINE).param("status", "FINISHED").with(me()))
            .andExpect(status().isBadRequest());
    }

    @Test
    void dateRangeOfTodayIncludesTodaysRequests() throws Exception {
        String today = LocalDate.now().toString();

        mockMvc.perform(get(MINE).param("from", today).param("to", today).with(me()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(3)));
    }

    @Test
    void dateRangeInThePastReturnsNothing() throws Exception {
        mockMvc.perform(get(MINE)
                .param("from", LocalDate.now().minusDays(7).toString())
                .param("to", LocalDate.now().minusDays(1).toString())
                .with(me()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void fromAfterToGets400() throws Exception {
        mockMvc.perform(get(MINE).param("from", "2026-11-20").param("to", "2026-11-10").with(me()))
            .andExpect(status().isBadRequest());
    }

    // ---------- สิทธิ์ ----------

    @Test
    void staffCannotUseMine() throws Exception {
        mockMvc.perform(get(MINE).with(user("staff01").roles("STAFF")))
            .andExpect(status().isForbidden());
    }

    @Test
    void anonymousGets401() throws Exception {
        mockMvc.perform(get(MINE)).andExpect(status().isUnauthorized());
    }

    // ---------- helpers ----------

    private Long save(String studentId, String area, String status) {
        Long id = repository.save(new RepairRequest(
            studentId, "A-101", area, "รายการทดสอบ", "")).getId();

        if (!"PENDING".equals(status)) {
            // รับเรื่องผ่าน service เดียวกับที่ระบบใช้ จึงมี acceptedAt
            service.accept(id);
        }
        if ("DONE".equals(status)) {
            RepairRequest row = repository.findById(id).orElseThrow();
            row.updateStatus("DONE", null);
            repository.save(row);
        }
        return id;
    }

    private static RequestPostProcessor me() {
        return user(ME).roles("STUDENT");
    }
}
