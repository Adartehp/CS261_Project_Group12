package com.example.demo.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class RepairRequestCreateTest {

    @Autowired
    private MockMvc mockMvc;

    private static final String URL = "/api/repair-requests";

    // ใส่ studentId ของคนอื่นมาด้วย เพื่อตรวจว่า backend ไม่เอาไปใช้
    private static final String BODY_WITH_OTHER_STUDENT_ID = """
        {
            "studentId": "6600000000",
            "roomNumber": "A101",
            "area": "bedroom",
            "repairItem": "หลอดไฟ",
            "description": "ไฟดับ"
        }
        """;

    @Test
    void studentCreatesRequestUnderOwnStudentId() throws Exception {

        mockMvc.perform(post(URL)
                .with(user("6609999999").roles("STUDENT"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(BODY_WITH_OTHER_STUDENT_ID))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.studentId").value("6609999999"))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void staffCannotCreateRequest() throws Exception {

        mockMvc.perform(post(URL)
                .with(user("staff01").roles("STAFF"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(BODY_WITH_OTHER_STUDENT_ID))
                .andExpect(status().isForbidden());
    }

    @Test
    void unauthenticatedUserCannotCreateRequest() throws Exception {

        mockMvc.perform(post(URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(BODY_WITH_OTHER_STUDENT_ID))
                .andExpect(status().isUnauthorized());
    }
}
