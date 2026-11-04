package com.aerosaga.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aerosaga.dto.TelemetryRequest;
import com.aerosaga.entity.Telemetry;
import com.aerosaga.exception.ResourceNotFoundException;
import com.aerosaga.repository.DroneRepository;
import com.aerosaga.repository.TelemetryRepository;

@Service
public class TelemetryService {

    private final TelemetryRepository telemetryRepository;
    private final DroneRepository droneRepository;
    private final SafetyRuleEngine safetyRuleEngine;

    public TelemetryService(
            TelemetryRepository telemetryRepository,
            DroneRepository droneRepository,
            SafetyRuleEngine safetyRuleEngine) {
        this.telemetryRepository = telemetryRepository;
        this.droneRepository = droneRepository;
        this.safetyRuleEngine = safetyRuleEngine;
    }

    public List<Telemetry> getAllTelemetry() {
        return telemetryRepository.findAll();
    }

    public List<Telemetry> getTelemetryByDrone(Long droneId) {
        if (!droneRepository.existsById(droneId)) {
            throw new ResourceNotFoundException(
                    "Drone not found with id: " + droneId
            );
        }
        return telemetryRepository.findByDroneIdOrderByRecordedAtDesc(droneId);
    }

    @Transactional
    public Telemetry recordTelemetry(Long droneId, TelemetryRequest request) {
        Telemetry saved = saveTelemetry(droneId, request, "DEVICE");

        safetyRuleEngine.evaluateBattery(
                droneId,
                request.getBatteryLevel()
        );

        return saved;
    }

    @Transactional
    public Telemetry recordMissionTelemetry(
            Long droneId,
            TelemetryRequest request) {
        return saveTelemetry(droneId, request, "SIMULATED_MISSION");
    }

    private Telemetry saveTelemetry(
            Long droneId,
            TelemetryRequest request,
            String source) {
        if (!droneRepository.existsById(droneId)) {
            throw new ResourceNotFoundException(
                    "Drone not found with id: " + droneId
            );
        }

        Telemetry telemetry = new Telemetry();
        telemetry.setDroneId(droneId);
        telemetry.setBatteryLevel(request.getBatteryLevel());
        telemetry.setLatitude(request.getLatitude());
        telemetry.setLongitude(request.getLongitude());
        telemetry.setAltitude(request.getAltitude());
        telemetry.setSource(source);

        return telemetryRepository.save(telemetry);
    }
}
