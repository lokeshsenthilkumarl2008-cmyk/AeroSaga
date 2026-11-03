package com.AeroSaga.controller;


import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.AeroSaga.entity.EmergencyAlert;
import com.AeroSaga.service.EmergencyAlertService;

@RestController
@RequestMapping("/api/emergency-alerts")
public class EmergencyAlertController {

    private final EmergencyAlertService alertService;

    public EmergencyAlertController(
            EmergencyAlertService alertService) {
        this.alertService = alertService;
    }

    // Create emergency alert
    @PostMapping
    @ResponseStatus(HttpStatus.OK)
    public EmergencyAlert createAlert(
            @RequestParam Long droneId,
            @RequestParam String alertType) {

        return alertService.createAlert(droneId, alertType);
    }

    // Get all alerts
    @GetMapping
    public List<EmergencyAlert> getAllAlerts() {
        return alertService.getAllAlerts();
    }

    // Get alerts by drone ID
    @GetMapping("/drone/{droneId}")
    public List<EmergencyAlert> getAlertsByDroneId(
            @PathVariable Long droneId) {

        return alertService.getAlertsByDroneId(droneId);
    }

    // Get active alerts
    @GetMapping("/active")
    public List<EmergencyAlert> getActiveAlerts() {
        return alertService.getActiveAlerts();
    }

    // Resolve emergency alert
    @PutMapping("/{alertId}/resolve")
    public ResponseEntity<EmergencyAlert> resolveAlert(
            @PathVariable Long alertId) {

        EmergencyAlert resolvedAlert =
                alertService.resolveAlert(alertId);

        return ResponseEntity.ok(resolvedAlert);
    }
}
