
package controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import entity.Drone;
import repository.DroneRepository;

@RestController
@RequestMapping("/api/drones")
public class DroneController {

    private final DroneRepository droneRepository;

    public DroneController(DroneRepository droneRepository) {
        this.droneRepository = droneRepository;
    }

    // Get all drones
    @GetMapping
    public ResponseEntity<List<Drone>> getAllDrones() {
        return ResponseEntity.ok(droneRepository.findAll());
    }
    @GetMapping("/test")
    public String test() {
        return "AeroSaga Drone API is working!";
    }

    // Get a drone by ID
    @GetMapping("/{id}")
    public ResponseEntity<Drone> getDroneById(@PathVariable Long id) {
        return droneRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Register a new drone
    @PostMapping
    public ResponseEntity<?> createDrone(@RequestBody Drone drone) {

        if (drone.getSerialNumber() == null ||
                drone.getSerialNumber().isBlank()) {
            return ResponseEntity.badRequest()
                    .body("Serial number is required");
        }

        if (droneRepository.existsBySerialNumber(drone.getSerialNumber())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("A drone with this serial number already exists");
        }

        Drone savedDrone = droneRepository.save(drone);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(savedDrone);
    }

    // Update a drone
    @PutMapping("/{id}")
    public ResponseEntity<Drone> updateDrone(
            @PathVariable Long id,
            @RequestBody Drone updatedDrone) {

        return droneRepository.findById(id)
                .map(existingDrone -> {
                    existingDrone.setName(updatedDrone.getName());
                    existingDrone.setBatteryLevel(
                            updatedDrone.getBatteryLevel());
                    existingDrone.setLatitude(updatedDrone.getLatitude());
                    existingDrone.setLongitude(updatedDrone.getLongitude());
                    existingDrone.setHomeLatitude(
                            updatedDrone.getHomeLatitude());
                    existingDrone.setHomeLongitude(
                            updatedDrone.getHomeLongitude());
                    existingDrone.setStatus(updatedDrone.getStatus());

                    Drone savedDrone =
                            droneRepository.save(existingDrone);

                    return ResponseEntity.ok(savedDrone);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Delete a drone
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDrone(@PathVariable Long id) {

        if (!droneRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        droneRepository.deleteById(id);

        return ResponseEntity.noContent().build();
    }
}
