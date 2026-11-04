package com.aerosaga;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import io.temporal.client.WorkflowClient;
import io.temporal.serviceclient.WorkflowServiceStubs;
import io.temporal.serviceclient.WorkflowServiceStubsOptions;
import io.temporal.worker.Worker;
import io.temporal.worker.WorkerFactory;

@Configuration
@Profile("external-temporal")
public class ExternalTemporalConfiguration {

    @Bean(destroyMethod = "shutdown")
    public WorkflowServiceStubs workflowServiceStubs(
            @Value("${TEMPORAL_TARGET:localhost:7233}") String target) {
        return WorkflowServiceStubs.newServiceStubs(
                WorkflowServiceStubsOptions.newBuilder()
                        .setTarget(target)
                        .build()
        );
    }

    @Bean
    public WorkflowClient workflowClient(WorkflowServiceStubs serviceStubs) {
        return WorkflowClient.newInstance(serviceStubs);
    }

    @Bean(initMethod = "start", destroyMethod = "shutdown")
    public WorkerFactory droneWorkerFactory(
            WorkflowClient workflowClient,
            DroneMissionActivities activities) {
        WorkerFactory factory = WorkerFactory.newInstance(workflowClient);
        Worker worker = factory.newWorker("DRONE_TASK_QUEUE");
        worker.registerWorkflowImplementationTypes(DroneMissionWorkflowImpl.class);
        worker.registerActivitiesImplementations(activities);
        return factory;
    }
}
