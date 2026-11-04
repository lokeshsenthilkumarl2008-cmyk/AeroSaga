package com.aerosaga.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aerosaga.entity.WorkflowSignal;
import com.aerosaga.service.WorkflowSignalService;

@RestController
@RequestMapping("/api/workflow-signals")
public class WorkflowSignalController {

    private final WorkflowSignalService workflowSignalService;

    public WorkflowSignalController(WorkflowSignalService workflowSignalService) {
        this.workflowSignalService = workflowSignalService;
    }

    @GetMapping
    public List<WorkflowSignal> getAllSignals() {
        return workflowSignalService.getAllSignals();
    }

    @GetMapping("/drone/{droneId}")
    public List<WorkflowSignal> getSignalsByDrone(@PathVariable Long droneId) {
        return workflowSignalService.getSignalsByDrone(droneId);
    }
}
