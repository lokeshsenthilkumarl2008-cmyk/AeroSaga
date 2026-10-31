package repository;

import entity.WorkflowSignal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface WorkflowSignalRepository extends JpaRepository<WorkflowSignal, Long> {

    List<WorkflowSignal> findByDroneId(Long droneId);

    List<WorkflowSignal> findBySignalStatus(String signalStatus);

    List<WorkflowSignal> findBySignalType(String signalType);

    WorkflowSignal findTopByDroneIdOrderByCreatedAtDesc(Long droneId);

    List<WorkflowSignal> findBySignalTypeAndSignalStatus(String signalType, String signalStatus);

    List<WorkflowSignal> findByDroneIdAndCreatedAtBetween(
        Long droneId, LocalDateTime start, LocalDateTime end);

    List<WorkflowSignal> findByMessageContaining(String keyword);
}
