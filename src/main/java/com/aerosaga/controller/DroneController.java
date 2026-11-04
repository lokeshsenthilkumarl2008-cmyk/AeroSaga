
package com.aerosaga.controller;

import java.util.List;


import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.aerosaga.entity.Drone;
import com.aerosaga.service.DroneService;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.PutMapping;
@RestController
@RequestMapping("/api/drones")
public class DroneController {

    private final DroneService droneService;

    public DroneController(DroneService droneService) {
        this.droneService = droneService;
    }

    @GetMapping
    public List<Drone> getAllDrones() {
        return droneService.getAllDrones();
    }

    @GetMapping("/{id}")
    public Drone getDroneById(@PathVariable Long id) {
        return droneService.getDroneById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Drone createDrone(@Valid @RequestBody Drone drone) {
        return droneService.createDrone(drone);
    }
    
    @PutMapping("/{id}")
    public Drone updateDrone(
            @PathVariable Long id,
            @Valid @RequestBody Drone drone) {
        return droneService.updateDrone(id, drone);
    }
}
