
package com.aerosaga.repository;
import org.springframework.data.jpa.repository.JpaRepository;

import com.aerosaga.entity.Drone;

public interface DroneRepository extends JpaRepository<Drone, Long> {

}
