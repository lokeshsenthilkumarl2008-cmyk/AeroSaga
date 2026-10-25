package com.AeroSaga;

import org.springframework.stereotype.Component;

import com.AeroSaga.dto.TelemetryRequest;
import com.AeroSaga.entity.Drone;
import com.AeroSaga.entity.Mission;
import com.AeroSaga.service.DroneCityCoordinates;
import com.AeroSaga.service.MissionService;
import com.AeroSaga.service.TelemetryService;

@Component
public class DroneMissionActivitiesImpl implements DroneMissionActivities {

    private static final int FLIGHT_SAMPLES = 10;
    private static final long SAMPLE_DELAY_MS = 500;

    private final MissionService missionService;
    private final TelemetryService telemetryService;

    public DroneMissionActivitiesImpl(
            MissionService missionService,
            TelemetryService telemetryService) {
        this.missionService = missionService;
        this.telemetryService = telemetryService;
    }

    @Override
    public String takeOff(String missionId) {
        Mission mission = getMission(missionId);
        Drone drone = mission.getDrone();
        missionService.updateWorkflowStatus(missionId, "RUNNING");
        recordSignal(
                missionId,
                "TAKEOFF",
                "IN_PROGRESS",
                "Drone is taking off"
        );
        DroneCityCoordinates home = DroneCityCoordinates.require(
                drone.getLocation()
        );
        recordTelemetry(drone, home, 80, 99.5);
        recordSignal(
                missionId,
                "TAKEOFF",
                "COMPLETED",
                "Takeoff complete"
        );

        return "TAKEOFF_SUCCESS";
    }

    @Override
    public String travel(String missionId) {
        Mission mission = getMission(missionId);
        Drone drone = mission.getDrone();
        DroneCityCoordinates home = DroneCityCoordinates.require(
                drone.getLocation()
        );
        DroneCityCoordinates destination = DroneCityCoordinates.require(
                mission.getDestination()
        );
        recordSignal(
                missionId,
                "TRAVEL",
                "IN_PROGRESS",
                "Drone is en route to " + mission.getDestination()
        );
        recordFlightPath(drone, home, destination);
        recordSignal(
                missionId,
                "TRAVEL",
                "COMPLETED",
                "Arrived at " + mission.getDestination()
        );

        return "TRAVEL_SUCCESS";
    }

    @Override
    public String completeDelivery(String missionId) {
        Mission mission = getMission(missionId);
        Drone drone = mission.getDrone();
        DroneCityCoordinates destination = DroneCityCoordinates.require(
                mission.getDestination()
        );
        recordSignal(
                missionId,
                "DELIVERY",
                "IN_PROGRESS",
                "Completing delivery at " + mission.getDestination()
        );
        recordTelemetry(drone, destination, 20, 97.5);
        pauseBetweenTelemetrySamples();
        recordSignal(
                missionId,
                "DELIVERY",
                "COMPLETED",
                "Delivery completed"
        );
        return "DELIVERY_SUCCESS";
    }

    @Override
    public String returnHome(String missionId) {
        Mission mission = getMission(missionId);
        Drone drone = mission.getDrone();
        DroneCityCoordinates home = DroneCityCoordinates.require(
                drone.getLocation()
        );
        DroneCityCoordinates destination = DroneCityCoordinates.require(
                mission.getDestination()
        );
        recordSignal(
                missionId,
                "RETURN_HOME",
                "IN_PROGRESS",
                "Drone is returning to " + drone.getLocation()
        );
        recordFlightPath(drone, destination, home);
        missionService.updateWorkflowStatus(missionId, "COMPLETED");
        recordSignal(
                missionId,
                "RETURN_HOME",
                "COMPLETED",
                "Returned to base; mission completed"
        );

        return "RETURN_SUCCESS";
    }

    @Override
    public void failMission(String missionId) {
        missionService.updateWorkflowStatus(missionId, "FAILED");
        recordSignal(missionId, "MISSION", "FAILED", "Mission workflow failed");
    }

    private void recordSignal(
            String missionId,
            String type,
            String status,
            String message) {
        missionService.recordWorkflowSignal(missionId, type, status, message);
    }

    private Mission getMission(String missionId) {
        return missionService.getMissionById(Long.parseLong(missionId));
    }

    private void recordFlightPath(
            Drone drone,
            DroneCityCoordinates start,
            DroneCityCoordinates end) {
        for (int sample = 1; sample <= FLIGHT_SAMPLES; sample++) {
            double progress = (double) sample / FLIGHT_SAMPLES;
            double latitude = start.latitude()
                    + (end.latitude() - start.latitude()) * progress;
            double longitude = start.longitude()
                    + (end.longitude() - start.longitude()) * progress;
            double altitude = 100 + 80 * Math.sin(Math.PI * progress);
            double battery = 99.5 - 2 * progress;
            recordTelemetry(
                    drone,
                    new DroneCityCoordinates(latitude, longitude),
                    altitude,
                    battery
            );
            if (sample < FLIGHT_SAMPLES) {
                pauseBetweenTelemetrySamples();
            }
        }
    }

    private void recordTelemetry(
            Drone drone,
            DroneCityCoordinates coordinates,
            double altitude,
            double battery) {
        TelemetryRequest request = new TelemetryRequest();
        request.setLatitude(coordinates.latitude());
        request.setLongitude(coordinates.longitude());
        request.setAltitude(altitude);
        request.setBatteryLevel(battery);
        telemetryService.recordMissionTelemetry(drone.getId(), request);
    }

    private void pauseBetweenTelemetrySamples() {
        try {
            Thread.sleep(SAMPLE_DELAY_MS);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(
                    "Mission telemetry simulation was interrupted",
                    exception
            );
        }
    }
}