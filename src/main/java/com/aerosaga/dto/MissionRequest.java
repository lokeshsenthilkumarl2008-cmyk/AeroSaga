
package com.aerosaga.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class MissionRequest {

    @NotNull(message = "Drone ID is required")
    @Positive(message = "Drone ID must be positive")
    private Long droneId;

    @NotBlank(message = "Mission name is required")
    private String missionName;

    @NotBlank(message = "Destination is required")
    private String destination;

    public MissionRequest() {
    }

    public Long getDroneId() {
        return droneId;
    }

    public void setDroneId(Long droneId) {
        this.droneId = droneId;
    }

    public String getMissionName() {
        return missionName;
    }

    public void setMissionName(String missionName) {
        this.missionName = missionName;
    }

    public String getDestination() {
        return destination;
    }

    public void setDestination(String destination) {
        this.destination = destination;
    }
}
