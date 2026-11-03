
package com.AeroSaga.service;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.AeroSaga.dto.TelemetryRequest;
import com.AeroSaga.entity.Drone;
import com.AeroSaga.entity.Telemetry;
import com.AeroSaga.exception.ResourceNotFoundException;
import com.AeroSaga.repository.DroneRepository;
import com.AeroSaga.repository.TelemetryRepository;

@Service
public class TelemetryService {

    private static final Logger logger =
            LoggerFactory.getLogger(TelemetryService.class);

    private final TelemetryRepository telemetryRepository;
    private final DroneRepository droneRepository;
    private final SafetyRuleService safetyRuleService;
    private final EmergencyAlertService emergencyAlertService;

    public TelemetryService(
            TelemetryRepository telemetryRepository,
            DroneRepository droneRepository,
            SafetyRuleService safetyRuleService,
            EmergencyAlertService emergencyAlertService) {

        this.telemetryRepository = telemetryRepository;
        this.droneRepository = droneRepository;
        this.safetyRuleService = safetyRuleService;
        this.emergencyAlertService = emergencyAlertService;
    }

    // Get all telemetry records
    public List<Telemetry> getAllTelemetry() {
        return telemetryRepository.findAll();
    }

    // Get telemetry records for a particular drone
    public List<Telemetry> getTelemetryByDrone(Long droneId) {

        if (!droneRepository.existsById(droneId)) {
            throw new ResourceNotFoundException(
                    "Drone not found with id: " + droneId
            );
        }

        return telemetryRepository
                .findByDrone_IdOrderByRecordedAtDesc(droneId);
    }

    // Alternative method using Ankit Mudi's method name
    public List<Telemetry> getTelemetryByDroneId(Long droneId) {
        return getTelemetryByDrone(droneId);
    }

    // Record device-generated telemetry
    @Transactional
    public Telemetry recordTelemetry(
            Long droneId,
            TelemetryRequest request) {

        return saveTelemetry(droneId, request, "DEVICE");
    }

    // Record simulated mission telemetry
    @Transactional
    public Telemetry recordMissionTelemetry(
            Long droneId,
            TelemetryRequest request) {

        return saveTelemetry(
                droneId,
                request,
                "SIMULATED_MISSION"
        );
    }

    // Ankit Mudi's original request-based method
    @Transactional
    public Telemetry saveTelemetry(TelemetryRequest request) {

        if (request == null || request.getDroneId() == null) {
            throw new IllegalArgumentException(
                    "Telemetry request and drone ID are required"
            );
        }

        return saveTelemetry(
                request.getDroneId(),
                request,
                "DEVICE"
        );
    }

    // Common telemetry saving and safety processing logic
    private Telemetry saveTelemetry(
            Long droneId,
            TelemetryRequest request,
            String source) {

        if (request == null) {
            throw new IllegalArgumentException(
                    "Telemetry request cannot be null"
            );
        }

        Drone drone = droneRepository.findById(droneId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Drone not found with id: " + droneId
                ));

        Telemetry telemetry = new Telemetry();

        // Set drone relationship
        telemetry.setDrone(drone);

        // Set telemetry information
        telemetry.setBatteryLevel(request.getBatteryLevel());
        telemetry.setLatitude(request.getLatitude());
        telemetry.setLongitude(request.getLongitude());
        telemetry.setAltitude(request.getAltitude());
        telemetry.setSpeed(request.getSpeed());
        telemetry.setSignalStrength(request.getSignalStrength());

        // Identify telemetry source
        telemetry.setSource(source);

        // Save telemetry first
        Telemetry savedTelemetry =
                telemetryRepository.save(telemetry);

        // Apply safety rules
        List<String> alerts =
                safetyRuleService.checkSafetyRules(savedTelemetry);

        if (alerts.isEmpty()) {

            logger.info(
                    "Drone {} is SAFE",
                    droneId
            );

        } else {

            logger.warn(
                    "Drone {} safety alerts: {}",
                    droneId,
                    alerts
            );

            // Create emergency alerts
            for (String alertType : alerts) {

                emergencyAlertService.createAlert(
                        droneId,
                        alertType
                );
            }
        }

        return savedTelemetry;
    }
}
