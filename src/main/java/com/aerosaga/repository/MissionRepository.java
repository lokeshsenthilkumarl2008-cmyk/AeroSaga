package com.AeroSaga.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import com.AeroSaga.entity.Mission;

public interface MissionRepository extends JpaRepository<Mission, Long> {

    List<Mission> findByStatus(String status);

    Optional<Mission> findFirstByDrone_IdAndStatusIgnoreCaseOrderByIdDesc(
            Long droneId, String status
    );
}
