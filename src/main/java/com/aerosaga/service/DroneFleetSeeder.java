package com.aerosaga.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.aerosaga.entity.Drone;
import com.aerosaga.repository.DroneRepository;

@Component
public class DroneFleetSeeder implements CommandLineRunner {

    private static final int DRONES_PER_CITY = 50;
    private static final List<String> CITIES = List.of(
            "Bangalore",
            "Chennai",
            "Delhi",
            "Mumbai",
            "Kolkata",
            "Hyderabad",
            "Ahmedabad"
    );

    private final DroneRepository droneRepository;

    public DroneFleetSeeder(DroneRepository droneRepository) {
        this.droneRepository = droneRepository;
    }

    @Override
    public void run(String... args) {
        Map<String, Long> countsByCity = droneRepository.findAll().stream()
                .filter(drone -> drone.getLocation() != null)
                .collect(Collectors.groupingBy(
                        drone -> drone.getLocation().trim().toLowerCase(Locale.ROOT),
                        Collectors.counting()
                ));

        List<Drone> seedDrones = new ArrayList<>();
        for (String city : CITIES) {
            long existingCount = countsByCity.getOrDefault(
                    city.toLowerCase(Locale.ROOT),
                    0L
            );
            for (long number = existingCount + 1;
                    number <= DRONES_PER_CITY;
                    number++) {
                Drone drone = new Drone();
                drone.setName(String.format("%s Drone %03d", city, number));
                drone.setModel("AeroSaga S1");
                drone.setLocation(city);
                drone.setStatus("AVAILABLE");
                seedDrones.add(drone);
            }
        }

        if (!seedDrones.isEmpty()) {
            droneRepository.saveAll(seedDrones);
        }
    }
}
