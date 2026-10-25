package com.AeroSaga.service;

import java.util.Locale;
import java.util.Map;

public record DroneCityCoordinates(double latitude, double longitude) {

    private static final Map<String, DroneCityCoordinates> CITIES = Map.of(
            "bangalore", new DroneCityCoordinates(12.9716, 77.5946),
            "bengaluru", new DroneCityCoordinates(12.9716, 77.5946),
            "chennai", new DroneCityCoordinates(13.0827, 80.2707),
            "delhi", new DroneCityCoordinates(28.6139, 77.2090),
            "mumbai", new DroneCityCoordinates(19.0760, 72.8777),
            "kolkata", new DroneCityCoordinates(22.5726, 88.3639),
            "hyderabad", new DroneCityCoordinates(17.3850, 78.4867),
            "ahmedabad", new DroneCityCoordinates(23.0225, 72.5714)
    );

    public static DroneCityCoordinates require(String city) {
        DroneCityCoordinates coordinates = CITIES.get(
                city == null ? "" : city.trim().toLowerCase(Locale.ROOT)
        );
        if (coordinates == null) {
            throw new IllegalArgumentException(
                    "Unsupported city: " + city
            );
        }
        return coordinates;
    }
}
