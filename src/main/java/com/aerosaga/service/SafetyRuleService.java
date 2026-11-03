
package com.AeroSaga.service;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.AeroSaga.entity.Mission;
import com.AeroSaga.entity.SafetyEvent;
import com.AeroSaga.entity.Telemetry;
import com.AeroSaga.repository.MissionRepository;
import com.AeroSaga.repository.SafetyEventRepository;

@Service
public class SafetyRuleService {

    private static final Logger log =
            LoggerFactory.getLogger(SafetyRuleService.class);

    private static final double WARNING_BATTERY = 20.0;
    private static final double CRITICAL_BATTERY = 10.0;
    private static final int WEAK_SIGNAL = 30;

    private final MissionRepository missionRepository;
    private final MissionService missionService;
    private final SafetyEventRepository safetyEventRepository;

    public SafetyRuleService(
            MissionRepository missionRepository,
            MissionService missionService,
            SafetyEventRepository safetyEventRepository) {

        this.missionRepository = missionRepository;
        this.missionService = missionService;
        this.safetyEventRepository = safetyEventRepository;
    }

    public List<String> checkSafetyRules(Telemetry telemetry) {

        List<String> alerts = new ArrayList<>();

        if (telemetry == null) {
            return alerts;
        }

        Long droneId = telemetry.getDrone() != null
                ? telemetry.getDrone().getId()
                : null;

        // Rule 1: Battery Safety
        Double batteryLevel = telemetry.getBatteryLevel();

        if (batteryLevel != null) {

            if (batteryLevel <= CRITICAL_BATTERY) {

                alerts.add("CRITICAL_BATTERY");

                log.error(
                        "CRITICAL: Drone {} battery at {}%",
                        droneId, batteryLevel
                );

                if (droneId != null) {

                    missionRepository
                            .findFirstByDrone_IdAndStatusIgnoreCaseOrderByIdDesc(
                                    droneId, "RUNNING")
                            .ifPresentOrElse(
                                    mission -> triggerEmergency(
                                            mission, batteryLevel),
                                    () -> saveEvent(
                                            droneId,
                                            null,
                                            "CRITICAL_BATTERY",
                                            "CRITICAL",
                                            "Critical battery: "
                                                    + batteryLevel + "%"
                                    )
                            );
                }

            } else if (batteryLevel <= WARNING_BATTERY) {

                alerts.add("LOW_BATTERY");

                log.warn(
                        "LOW BATTERY: Drone {} battery at {}%",
                        droneId, batteryLevel
                );

                if (droneId != null) {
                    saveEvent(
                            droneId,
                            null,
                            "LOW_BATTERY",
                            "WARNING",
                            "Low battery: " + batteryLevel + "%"
                    );
                }
            }
        }

        // Rule 2: Weak Signal
        Integer signalStrength = telemetry.getSignalStrength();

        if (signalStrength != null
                && signalStrength < WEAK_SIGNAL) {

            alerts.add("SIGNAL_LOSS");

            log.warn(
                    "WEAK SIGNAL: Drone {} signal strength {}",
                    droneId, signalStrength
            );

            if (droneId != null) {
                saveEvent(
                        droneId,
                        null,
                        "SIGNAL_LOSS",
                        "WARNING",
                        "Weak signal: " + signalStrength
                );
            }
        }

        return alerts;
    }

    private void triggerEmergency(
            Mission mission,
            Double batteryLevel) {

        String reason =
                "Critical battery level: " + batteryLevel + "%";

        Long droneId = mission.getDrone().getId();
        Long missionId = mission.getId();

        saveEvent(
                droneId,
                missionId,
                "CRITICAL_BATTERY",
                "CRITICAL",
                reason
        );

        try {

            missionService.requestEmergency(missionId, reason);

            saveEvent(
                    droneId,
                    missionId,
                    "EMERGENCY_RETURN",
                    "CRITICAL",
                    "Emergency Return-to-Home requested"
            );

        } catch (RuntimeException e) {

            log.error(
                    "Emergency request failed for mission {}",
                    missionId,
                    e
            );

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
