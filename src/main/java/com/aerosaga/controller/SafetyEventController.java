package com.AeroSaga.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.AeroSaga.entity.SafetyEvent;
import com.AeroSaga.repository.SafetyEventRepository;

@RestController
@RequestMapping("/api/sentinel/events")
@CrossOrigin(origins = "*")
public class SafetyEventController {

    private final SafetyEventRepository repository;

    public SafetyEventController(SafetyEventRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<SafetyEvent> getAllEvents() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    @GetMapping("/drone/{droneId}")
    public List<SafetyEvent> getDroneEvents(@PathVariable Long droneId) {
        return repository.findByDroneIdOrderByCreatedAtDesc(droneId);
    }

    @GetMapping("/mission/{missionId}")
    public List<SafetyEvent> getMissionEvents(@PathVariable Long missionId) {
        return repository.findByMissionIdOrderByCreatedAtDesc(missionId);
    }
}
