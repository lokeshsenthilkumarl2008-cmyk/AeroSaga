package com.AeroSaga.service;

import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;

import com.AeroSaga.entity.EmergencyAlert;
import com.AeroSaga.exception.ResourceNotFoundException;
import com.AeroSaga.repository.EmergencyAlertRepository;
import com.AeroSaga.repository.DroneRepository;

@Service
public class EmergencyAlertService {

    private final EmergencyAlertRepository alertRepository;
    private final DroneRepository droneRepository;

    public EmergencyAlertService(
            EmergencyAlertRepository alertRepository,
            DroneRepository droneRepository) {
        this.alertRepository = alertRepository;
        this.droneRepository = droneRepository;
    }

    public EmergencyAlert createAlert(
            Long droneId, String alertType) {

        if (droneId == null || !droneRepository.existsById(droneId)) {
            throw new ResourceNotFoundException(
                    "Drone not found with id: " + droneId
            );
        }
        if (alertType == null || alertType.isBlank()) {
            throw new IllegalArgumentException("Alert type is required");
        }

        String normalizedType = alertType.trim().toUpperCase(Locale.ROOT);
        var existingAlert =
                alertRepository
                        .findFirstByDroneIdAndAlertTypeAndStatusOrderByCreatedAtDesc(
                                droneId, normalizedType, "ACTIVE");
        if (existingAlert.isPresent()) return existingAlert.get();

        EmergencyAlert alert = new EmergencyAlert();

        alert.setDroneId(droneId);
        alert.setAlertType(normalizedType);

        alert.setMessage(switch (normalizedType) {
            case "LOW_BATTERY" -> "Drone battery level is low";
            case "CRITICAL_BATTERY" -> "Drone battery level is critically low";
            case "SIGNAL_LOSS" -> "Drone signal strength is critically low";
            default -> "Drone safety alert detected";
        });

        return alertRepository.save(alert);
    }

    public List<EmergencyAlert> getAllAlerts() {
        return alertRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<EmergencyAlert> getAlertsByDroneId(Long droneId) {
        if (!droneRepository.existsById(droneId)) {
            throw new ResourceNotFoundException(
                    "Drone not found with id: " + droneId
            );
        }
        return alertRepository.findByDroneIdOrderByCreatedAtDesc(droneId);
    }

    public List<EmergencyAlert> getActiveAlerts() {
        return alertRepository.findByStatusOrderByCreatedAtDesc("ACTIVE");
    }

    public EmergencyAlert resolveAlert(Long alertId) {
        if (alertId == null) {
            throw new IllegalArgumentException("Alert ID is required");
        }
        EmergencyAlert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Emergency alert not found with id: " + alertId));

        alert.setStatus("RESOLVED");

        return alertRepository.save(alert);
    }
}