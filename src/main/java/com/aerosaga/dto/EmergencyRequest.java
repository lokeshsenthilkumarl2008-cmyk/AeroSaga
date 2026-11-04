package com.aerosaga.dto;

import jakarta.validation.constraints.NotBlank;

public record EmergencyRequest(
        @NotBlank(message = "Emergency reason is required")
        String reason
) {}
