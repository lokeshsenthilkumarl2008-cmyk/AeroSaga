package com.aerosaga.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aerosaga.entity.WorkflowSignal;
import com.aerosaga.repository.WorkflowSignalRepository;

@Service
public class WorkflowSignalService {

    private final WorkflowSignalRepository workflowSignalRepository;

    public WorkflowSignalService(
            WorkflowSignalRepository workflowSignalRepository) {
        this.workflowSignalRepository = workflowSignalRepository;
    }

    @Transactional
    public WorkflowSignal record(
            Long missionId,
            Long droneId,
            String type,
            String status,
            String message) {
        WorkflowSignal signal = new WorkflowSignal();
        signal.setDroneId(droneId);
        signal.setMissionId(missionId);
        signal.setSignalType(type);
        signal.setSignalStatus(status);
        signal.setMessage(message);
        return workflowSignalRepository.save(signal);
    }

    public List<WorkflowSignal> getAllSignals() {
        return workflowSignalRepository.findAll();
    }

    public List<WorkflowSignal> getSignalsByDrone(Long droneId) {
        return workflowSignalRepository.findByDroneIdOrderByCreatedAtDesc(droneId);
    }
}
