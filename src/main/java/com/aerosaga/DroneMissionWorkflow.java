package com.aerosaga;

import io.temporal.workflow.WorkflowInterface;
import io.temporal.workflow.WorkflowMethod;
import io.temporal.workflow.SignalMethod;

@WorkflowInterface
public interface DroneMissionWorkflow {

    @WorkflowMethod
    String executeMission(String missionId);

    @SignalMethod
    void requestEmergency(String reason);
}
