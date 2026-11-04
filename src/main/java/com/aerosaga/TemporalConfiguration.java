package com.aerosaga;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import io.temporal.client.WorkflowClient;
import io.temporal.worker.Worker;
import io.temporal.testing.TestWorkflowEnvironment;

@Configuration
@Profile("!external-temporal")
public class TemporalConfiguration {

    @Bean(destroyMethod = "close")
    public TestWorkflowEnvironment temporalEnvironment(
            DroneMissionActivities activities) {
        TestWorkflowEnvironment environment =
                TestWorkflowEnvironment.newInstance();
        Worker worker = environment.newWorker("DRONE_TASK_QUEUE");
        worker.registerWorkflowImplementationTypes(DroneMissionWorkflowImpl.class);
        worker.registerActivitiesImplementations(activities);
        environment.start();
        return environment;
    }

    @Bean
    public WorkflowClient workflowClient(
            TestWorkflowEnvironment environment) {
        return environment.getWorkflowClient();
    }
}
