package com.aerosaga;

import static org.awaitility.Awaitility.await;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class MissionWorkflowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void dashboardApisPersistTelemetryAndExecuteTemporalMissions() throws Exception {
        String droneResponse = mockMvc.perform(post("/api/drones")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Workflow test drone","model":"Test model","location":"Bangalore","status":"AVAILABLE"}
                                """))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        long droneId = objectMapper.readTree(droneResponse).get("id").asLong();

        mockMvc.perform(post("/api/telemetry/drone/{droneId}", droneId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"batteryLevel":92,"latitude":12.9716,"longitude":77.5946,"altitude":120}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.source").value("DEVICE"));

        mockMvc.perform(get("/api/telemetry"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].droneId").value(droneId));

        String missionResponse = mockMvc.perform(post("/api/missions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new MissionRequestBody(
                                droneId,
                                "Workflow integration test",
                                "Chennai"
                        ))))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        long missionId = objectMapper.readTree(missionResponse).get("id").asLong();

        mockMvc.perform(post("/api/missions/{id}/execute", missionId))
                .andExpect(status().isAccepted());

        await()
                .atMost(Duration.ofSeconds(30))
                .untilAsserted(() -> mockMvc
                        .perform(get("/api/missions/{id}", missionId))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.status").value("COMPLETED")));

        mockMvc.perform(get("/api/workflow-signals/drone/{droneId}", droneId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].signalType", hasItem("TAKEOFF")))
                .andExpect(jsonPath("$[*].signalType", hasItem("TRAVEL")))
                .andExpect(jsonPath("$[*].signalType", hasItem("DELIVERY")))
                .andExpect(jsonPath("$[*].signalType", hasItem("RETURN_HOME")));

        mockMvc.perform(get("/api/telemetry/drone/{droneId}", droneId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].source").value("SIMULATED_MISSION"));
    }

    private record MissionRequestBody(
            long droneId,
            String missionName,
            String destination) {}
}
