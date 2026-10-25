
package com.AeroSaga.service;

import java.util.List;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import io.temporal.client.WorkflowClient;
import io.temporal.client.WorkflowOptions;

import com.AeroSaga.dto.MissionRequest;
import com.AeroSaga.entity.Drone;
import com.AeroSaga.entity.Mission;
import com.AeroSaga.exception.ResourceNotFoundException;
import com.AeroSaga.repository.DroneRepository;
import com.AeroSaga.repository.MissionRepository;

@Service
public class MissionService {

    private final MissionRepository missionRepository;
    private final DroneRepository droneRepository;
    private final WorkflowSignalService workflowSignalService;
    private final ObjectProvider<WorkflowClient> workflowClientProvider;

    public MissionService(
            MissionRepository missionRepository,
            DroneRepository droneRepository,
            WorkflowSignalService workflowSignalService,
            ObjectProvider<WorkflowClient> workflowClientProvider) {
        this.missionRepository = missionRepository;
        this.droneRepository = droneRepository;
        this.workflowSignalService = workflowSignalService;
        this.workflowClientProvider = workflowClientProvider;
    }

    public List<Mission> getAllMissions() {
        return missionRepository.findAll();
    }

    public Mission getMissionById(Long id) {
        return missionRepository.findById(id)
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "Mission not found with id: " + id
                    )
                );
    }

    @Transactional
    public Mission createMission(MissionRequest request) {
        DroneCityCoordinates.require(request.getDestination());
        Drone drone = droneRepository.findById(request.getDroneId())
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "Drone not found with id: " + request.getDroneId()
                    )
                );

        if (!"AVAILABLE".equalsIgnoreCase(drone.getStatus())) {
            throw new IllegalStateException(
                "Drone is not available for a mission"
            );
        }

        Mission mission = new Mission();
        mission.setMissionName(request.getMissionName());
        mission.setDestination(request.getDestination());
        mission.setStatus("PENDING");
        mission.setDrone(drone);
        drone.setStatus("IN_PROGRESS");
        droneRepository.save(drone);

        return missionRepository.save(mission);
    }

    public Mission executeMission(Long id) {
        Mission mission = getMissionById(id);
        if (!"PENDING".equalsIgnoreCase(mission.getStatus())) {
            throw new IllegalStateException(
                "Only pending missions can be executed"
            );
        }

        mission.setStatus("RUNNING");
        missionRepository.saveAndFlush(mission);

        var workflow = workflowClientProvider.getObject().newWorkflowStub(
                com.AeroSaga.DroneMissionWorkflow.class,
                WorkflowOptions.newBuilder()
                        .setTaskQueue("DRONE_TASK_QUEUE")
                        .setWorkflowId("drone-mission-" + id)
                        .build()
        );
        WorkflowClient.start(workflow::executeMission, id.toString());
        return getMissionById(id);
    }

    @Transactional
    public void recordWorkflowSignal(
            String missionId,
            String type,
            String status,
            String message) {
        long id = parseMissionId(missionId);
        Mission mission = getMissionById(id);
        workflowSignalService.record(
                id,
                mission.getDrone().getId(),
                type,
                status,
                message
        );
    }

    @Transactional
    public void updateWorkflowStatus(String missionId, String status) {
        long id = parseMissionId(missionId);
        Mission mission = getMissionById(id);
        mission.setStatus(status);

        if ("RUNNING".equals(status)) {
            mission.getDrone().setStatus("IN_FLIGHT");
            droneRepository.save(mission.getDrone());
        }

        if ("COMPLETED".equals(status) || "FAILED".equals(status)) {
            Drone drone = mission.getDrone();
            drone.setStatus("AVAILABLE");
            droneRepository.save(drone);
        }
        missionRepository.save(mission);
    }

    private long parseMissionId(String missionId) {
        try {
            return Long.parseLong(missionId);
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException(
                    "Mission workflow ID must be a numeric mission ID",
                    exception
            );
        }
    }

    public List<Mission> getMissionsByStatus(String status) {
        return missionRepository.findByStatus(status);
    }

    public Mission updateMission(Long id, Mission updatedMission) {
        Mission existingMission = getMissionById(id);

        existingMission.setMissionName(updatedMission.getMissionName());
        existingMission.setDestination(updatedMission.getDestination());

        if (updatedMission.getStatus() != null
                && !updatedMission.getStatus().isBlank()) {
            existingMission.setStatus(updatedMission.getStatus());
        }

        return missionRepository.save(existingMission);
    }

    @Transactional
    public void deleteMission(Long id) {
        Mission mission = getMissionById(id);
        if (!"PENDING".equalsIgnoreCase(mission.getStatus())) {
            throw new IllegalStateException(
                    "Only pending missions can be deleted"
            );
        }

        Drone drone = mission.getDrone();
        if (drone != null && "IN_PROGRESS".equalsIgnoreCase(drone.getStatus())) {
            drone.setStatus("AVAILABLE");
            droneRepository.save(drone);
        }
        missionRepository.delete(mission);
    }
}
