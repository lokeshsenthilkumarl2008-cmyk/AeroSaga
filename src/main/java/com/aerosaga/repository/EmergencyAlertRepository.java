package com.AeroSaga.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.AeroSaga.entity.EmergencyAlert;

public interface EmergencyAlertRepository
        extends JpaRepository<EmergencyAlert, Long> {

    List<EmergencyAlert> findAllByOrderByCreatedAtDesc();

    List<EmergencyAlert> findByDroneIdOrderByCreatedAtDesc(Long droneId);

    List<EmergencyAlert> findByStatusOrderByCreatedAtDesc(String status);

    Optional<EmergencyAlert> findFirstByDroneIdAndAlertTypeAndStatusOrderByCreatedAtDesc(
            Long droneId,
            String alertType,
            String status
    );
}
