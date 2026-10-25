package com.AeroSaga.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.AeroSaga.dto.TelemetryRequest;
import com.AeroSaga.entity.Telemetry;
import com.AeroSaga.exception.ResourceNotFoundException;
import com.AeroSaga.repository.DroneRepository;
import com.AeroSaga.repository.TelemetryRepository;

@Service
public class TelemetryService {

    private final TelemetryRepository telemetryRepository;
    private final DroneRepository droneRepository;

    public TelemetryService(
            TelemetryRepository telemetryRepository,
            DroneRepository droneRepository) {
        this.telemetryRepository = telemetryRepository;
        this.droneRepository = droneRepository;
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
        return saveTelemetry(droneId, request, "DEVICE");
    }

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
