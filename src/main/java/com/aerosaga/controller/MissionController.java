
package com.aerosaga.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.Valid;

import com.aerosaga.dto.MissionRequest;
import com.aerosaga.entity.Mission;
import com.aerosaga.service.MissionService;

@RestController
@RequestMapping("/api/missions")
public class MissionController {

    private final MissionService missionService;

    public MissionController(MissionService missionService) {
        this.missionService = missionService;
    }

    @GetMapping
    public List<Mission> getAllMissions() {
        return missionService.getAllMissions();
    }

    @GetMapping("/{id}")
    public Mission getMissionById(@PathVariable Long id) {
        return missionService.getMissionById(id);
    }

    @PostMapping("/{id}/execute")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public Mission executeMission(@PathVariable Long id) {
        try {
            return missionService.executeMission(id);
        } catch (io.temporal.client.WorkflowExecutionAlreadyStarted workflowAlreadyStarted) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A workflow already exists for this mission",
                    workflowAlreadyStarted
            );
        }
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mission createMission(
            @Valid @RequestBody MissionRequest request) {
        return missionService.createMission(request);
    }

    @GetMapping(params = "status")
    public List<Mission> getMissionsByStatus(
            @RequestParam String status) {
        return missionService.getMissionsByStatus(status);
    }

    @PutMapping("/{id}")
    public Mission updateMission(
            @PathVariable Long id,
            @Valid @RequestBody Mission mission) {
        return missionService.updateMission(id, mission);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMission(@PathVariable Long id) {
        missionService.deleteMission(id);
    }
}
