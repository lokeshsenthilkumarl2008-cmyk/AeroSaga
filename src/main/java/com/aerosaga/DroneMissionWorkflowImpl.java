package com.aerosaga;

import io.temporal.activity.ActivityOptions;
import io.temporal.common.RetryOptions;
import io.temporal.workflow.Workflow;

import java.time.Duration;

public class DroneMissionWorkflowImpl implements DroneMissionWorkflow {

    private boolean emergencyRequested = false;
    private String emergencyReason = "";

    private final DroneMissionActivities activities =
            Workflow.newActivityStub(
                    DroneMissionActivities.class,
                    ActivityOptions.newBuilder()
                            .setStartToCloseTimeout(Duration.ofSeconds(30))
                            .setRetryOptions(
                                    RetryOptions.newBuilder()
                                            .setInitialInterval(Duration.ofSeconds(2))
                                            .setBackoffCoefficient(2.0)
                                            .setMaximumAttempts(3)
                                            .build()
                            )
                            .build()
            );

    @Override
    public void requestEmergency(String reason) {
        emergencyRequested = true;
        emergencyReason = reason;
        Workflow.getLogger(DroneMissionWorkflowImpl.class)
                .warn("Emergency requested: " + reason);
    }

    private boolean handleEmergency(String missionId) {
        if (!emergencyRequested) {
            return false;
        }

        activities.emergencyReturnHome(missionId, emergencyReason);
        return true;
    }

    @Override
    public String executeMission(String missionId) {
        Workflow.getLogger(DroneMissionWorkflowImpl.class)
                .info("Starting drone mission: " + missionId);

        try {
            activities.takeOff(missionId);
            if (handleEmergency(missionId)) {
                return "Emergency return completed: " + missionId;
            }

            activities.travel(missionId);
            if (handleEmergency(missionId)) {
                return "Emergency return completed: " + missionId;
            }

            activities.completeDelivery(missionId);
            if (handleEmergency(missionId)) {
                return "Emergency return completed: " + missionId;
            }

            activities.returnHome(missionId);
            return "Mission completed: " + missionId;

        } catch (RuntimeException exception) {
            activities.failMission(missionId);
            throw exception;
        }
    }
}
