package com.AeroSaga;

import io.temporal.activity.ActivityInterface;
import io.temporal.activity.ActivityMethod;

@ActivityInterface
public interface DroneMissionActivities {

    @ActivityMethod
    String takeOff(String missionId);

    @ActivityMethod
    String travel(String missionId);

    @ActivityMethod
    String completeDelivery(String missionId);

    @ActivityMethod
    String returnHome(String missionId);

    @ActivityMethod
    void failMission(String missionId);
}