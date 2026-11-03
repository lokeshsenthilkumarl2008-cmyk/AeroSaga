package com.AeroSaga.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.AeroSaga.entity.Mission;
import com.AeroSaga.entity.SafetyEvent;
import com.AeroSaga.repository.MissionRepository;
import com.AeroSaga.repository.SafetyEventRepository;

@Service
public class SafetyRuleEngine {

    private static final Logger log =
            LoggerFactory.getLogger(SafetyRuleEngine.class);

    private static final double WARNING_BATTERY = 20.0;
    private static final double CRITICAL_BATTERY = 10.0;

    private final MissionRepository missionRepository;
    private final MissionService missionService;
    private final SafetyEventRepository safetyEventRepository;

    public SafetyRuleEngine(
            MissionRepository missionRepository,
            MissionService missionService,
            SafetyEventRepository safetyEventRepository) {

        this.missionRepository = missionRepository;
        this.missionService = missionService;
        this.safetyEventRepository = safetyEventRepository;
    }

    public void evaluateBattery(Long droneId, Double batteryLevel) {

        if (batteryLevel == null) return;

        if (batteryLevel <= CRITICAL_BATTERY) {

            log.error("CRITICAL: Drone {} battery at {}%",
                    droneId, batteryLevel);

            missionRepository
                    .findFirstByDrone_IdAndStatusIgnoreCaseOrderByIdDesc(
                            droneId, "RUNNING")
                    .ifPresentOrElse(
                            mission -> triggerEmergency(mission, batteryLevel),
                            () -> saveEvent(
                                    droneId, null,
                                    "CRITICAL_BATTERY", "CRITICAL",
                                    "Critical battery: " + batteryLevel + "%"
                            )
                    );

        } else if (batteryLevel <= WARNING_BATTERY) {

            log.warn("LOW BATTERY: Drone {} battery at {}%",
                    droneId, batteryLevel);

            saveEvent(
                    droneId, null,
                    "LOW_BATTERY", "WARNING",
                    "Low battery: " + batteryLevel + "%"
            );
        }
    }

    private void triggerEmergency(Mission mission, Double batteryLevel) {

        String reason = "Critical battery level: " + batteryLevel + "%";

        saveEvent(
                mission.getDrone().getId(),
                mission.getId(),
                "CRITICAL_BATTERY",
                "CRITICAL",
                reason
        );

        try {
            missionService.requestEmergency(mission.getId(), reason);

            saveEvent(
                    mission.getDrone().getId(),
                    mission.getId(),
                    "EMERGENCY_RETURN",
                    "CRITICAL",
                    "Emergency Return-to-Home requested"
            );

        } catch (RuntimeException e) {
            log.error("Emergency request failed for mission {}",
                    mission.getId(), e);
            throw e;
        }
    }

    private void saveEvent(
            Long droneId,
            Long missionId,
            String eventType,
            String severity,
            String message) {

        SafetyEvent event = new SafetyEvent();
        event.setDroneId(droneId);
        event.setMissionId(missionId);
        event.setEventType(eventType);
        event.setSeverity(severity);
        event.setMessage(message);

        safetyEventRepository.save(event);
    }
}