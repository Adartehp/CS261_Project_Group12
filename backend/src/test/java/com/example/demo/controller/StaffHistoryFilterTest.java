package com.example.demo.controller;

import com.example.demo.RepairRequest;
import com.example.demo.repository.RepairRequestRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * US8: เจ้าหน้าที่ดูประวัติคำร้องทั้งหมดและกรองได้ผ่าน GET /api/repair-requests
 */
@SpringBootTest
@AutoConfigureMockMvc
class StaffHistoryFilterTest {

    private static final String URL = "/api/repair-requests";
    private static final String STUDENT_A = "6609611111";
    private static final String STUDENT_B = "6609622222";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RepairRequestRepository repository;

    @BeforeEach
    void setUp() {
        repository.deleteAll();

        save(STUDENT_A, "A-101", "bedroom", "PENDING");
        save(STUDENT_A, "A-101", "bathroom", "IN_PROGRESS");
        save(STUDENT_B, "B-205", "bedroom", "DONE");
        save(STUDENT_B, "B-205", "air", "CANCELLED");
    }

    @Test
    void staffSeesEveryRequestNewestFirst() throws Exception {
        mockMvc.perform(get(URL).with(staff()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(4)))
            .andExpect(jsonPath("$[0].area").value("air"))
            .andExpect(jsonPath("$[3].area").value("bedroom"));
    }

    @Test
    void filterByStatusIsCaseInsensitive() throws Exception {
        mockMvc.perform(get(URL).param("status", "done").with(staff()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].status").value("DONE"));
    }

    @Test
    void filterByArea() throws Exception {
        mockMvc.perform(get(URL).param("area", "bedroom").with(staff()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)))
            .andExpect(jsonPath("$[*].area", everyItem(is("bedroom"))));
    }

    @Test
    void filterByRoom() throws Exception {
        mockMvc.perform(get(URL).param("room", "B-205").with(staff()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)))
            .andExpect(jsonPath("$[*].roomNumber", everyItem(is("B-205"))));
    }

    @Test
    void filterByStudentId() throws Exception {
        mockMvc.perform(get(URL).param("studentId", STUDENT_A).with(staff()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(2)))
            .andExpect(jsonPath("$[*].studentId", everyItem(is(STUDENT_A))));
    }

    @Test
    void filtersCombineWithAnd() throws Exception {
        mockMvc.perform(get(URL)
                .param("studentId", STUDENT_B)
                .param("area", "bedroom")
                .with(staff()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].status").value("DONE"));
    }

    @Test
    void dateRangeOfTodayIncludesRequestsCreatedToday() throws Exception {
        String today = LocalDate.now().toString();

        mockMvc.perform(get(URL)
                .param("from", today)
                .param("to", today)
                .with(staff()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(4)));
    }

    @Test
    void dateRangeInThePastReturnsNothing() throws Exception {
        String lastWeek = LocalDate.now().minusDays(7).toString();
        String yesterday = LocalDate.now().minusDays(1).toString();

        mockMvc.perform(get(URL)
                .param("from", lastWeek)
                .param("to", yesterday)
                .with(staff()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void fromAfterToReturnsBadRequest() throws Exception {
        mockMvc.perform(get(URL)
                .param("from", "2026-11-20")
                .param("to", "2026-11-10")
                .with(staff()))
            .andExpect(status().isBadRequest());
    }

    @Test
    void studentCannotSeeStaffHistory() throws Exception {
        mockMvc.perform(get(URL).with(user(STUDENT_A).roles("STUDENT")))
            .andExpect(status().isForbidden());
    }

    @Test
    void anonymousUserCannotSeeStaffHistory() throws Exception {
        mockMvc.perform(get(URL))
            .andExpect(status().isUnauthorized());
    }

    private void save(String studentId, String room, String area, String status) {
        RepairRequest row = repository.save(new RepairRequest(
            studentId,
            room,
            area,
            "รายการทดสอบ",
            ""
        ));

        if (!"PENDING".equals(status)) {
            row.updateStatus(status, null);
            repository.save(row);
        }
    }

    private static org.springframework.test.web.servlet.request.RequestPostProcessor staff() {
        return user("staff01").roles("STAFF");
    }
}
