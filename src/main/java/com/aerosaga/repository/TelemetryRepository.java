package com.aerosaga.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.aerosaga.entity.Telemetry;

public interface TelemetryRepository extends JpaRepository<Telemetry, Long> {

    List<Telemetry> findByDroneIdOrderByRecordedAtDesc(Long droneId);
}
