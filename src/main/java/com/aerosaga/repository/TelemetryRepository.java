package com.AeroSaga.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.AeroSaga.entity.Telemetry;

public interface TelemetryRepository extends JpaRepository<Telemetry, Long> {

    List<Telemetry> findByDrone_IdOrderByRecordedAtDesc(Long droneId);

}
