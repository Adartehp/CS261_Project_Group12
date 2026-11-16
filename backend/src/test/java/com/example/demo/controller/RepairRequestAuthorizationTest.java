
package com.example.demo.controller;

import com.example.demo.service.RepairRequestService;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;

@SpringBootTest
@AutoConfigureMockMvc
class RepairRequestAuthorizationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private RepairRequestService repairRequestService;

    private static final String STATUS_URL = "/api/repair-requests/1/status";

    private static final String REQUEST_BODY = """
        {
            "status": "DONE",
            "staffNote": "Repair completed"
        }
        """;

    @Test
    void staffCanAccessUpdateStatusEndpoint() throws Exception {

        mockMvc.perform(patch(STATUS_URL)
                .with(user("staff").roles("STAFF"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(REQUEST_BODY))
                .andExpect(status().isOk());
    }

    @Test
    void studentCannotAccessUpdateStatusEndpoint() throws Exception {

        mockMvc.perform(patch(STATUS_URL)
                .with(user("student").roles("STUDENT"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(REQUEST_BODY))
                .andExpect(status().isForbidden());
    }

    @Test
    void unauthenticatedUserCannotAccessUpdateStatusEndpoint() throws Exception {

        mockMvc.perform(patch(STATUS_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .content(REQUEST_BODY))
                .andExpect(status().isUnauthorized());
    }
}
