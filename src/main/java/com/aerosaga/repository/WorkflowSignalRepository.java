package com.aerosaga.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aerosaga.entity.WorkflowSignal;

public interface WorkflowSignalRepository extends JpaRepository<WorkflowSignal, Long> {

    List<WorkflowSignal> findByDroneIdOrderByCreatedAtDesc(Long droneId);
}
