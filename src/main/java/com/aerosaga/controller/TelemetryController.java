package com.aerosaga.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.aerosaga.dto.TelemetryRequest;
import com.aerosaga.entity.Telemetry;
import com.aerosaga.service.TelemetryService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/telemetry")
public class TelemetryController {

    private final TelemetryService telemetryService;

    public TelemetryController(TelemetryService telemetryService) {
        this.telemetryService = telemetryService;
    }

    @GetMapping
    public List<Telemetry> getAllTelemetry() {
        return telemetryService.getAllTelemetry();
    }

    @GetMapping("/drone/{droneId}")
    public List<Telemetry> getTelemetryByDrone(@PathVariable Long droneId) {
        return telemetryService.getTelemetryByDrone(droneId);
    }

    @PostMapping("/drone/{droneId}")
    @ResponseStatus(HttpStatus.CREATED)
    public Telemetry recordTelemetry(
            @PathVariable Long droneId,
            @Valid @RequestBody TelemetryRequest request) {
        return telemetryService.recordTelemetry(droneId, request);
    }
}
