package com.aerosaga.repository;

import com.aerosaga.entity.SafetyEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SafetyEventRepository extends JpaRepository<SafetyEvent, Integer> {

    List<SafetyEvent> findByDroneId(Integer droneId);
    List<SafetyEvent> findByMissionId(Integer missionId);
    List<SafetyEvent> findBySeverity(String severity);
    List<SafetyEvent> findByResolved(Boolean resolved);
    List<SafetyEvent> findByWorkflowStatus(String workflowStatus);
    List<SafetyEvent> findAllByOrderByDetectedAtDesc();
}
