
package com.aerosaga.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "safety_events")
public class SafetyEvent {

    @Id
    @Column(name = "event_id")
    private Integer eventId;

    @Column(name = "drone_id", nullable = false)
    private Integer droneId;

    @Column(name = "mission_id", nullable = false)
    private Integer missionId;

    @Column(name = "telemetry_id")
    private Integer telemetryId;

    @Column(name = "signal_id")
    private Integer signalId;

    @Column(name = "event_type", nullable = false, length = 30)
    private String eventType;

    @Column(name = "severity", nullable = false, length = 10)
    private String severity;

    @Column(name = "anomaly_score", precision = 6, scale = 4)
    private java.math.BigDecimal anomalyScore;

    @Column(name = "is_anomaly", nullable = false)
    private Boolean isAnomaly = false;

    @Column(name = "rule_triggered", length = 50)
    private String ruleTriggered;

    @Column(name = "action_taken", nullable = false, length = 30)
    private String actionTaken = "NONE";

    @Column(name = "workflow_id", length = 60)
    private String workflowId;

    @Column(name = "workflow_status", nullable = false, length = 20)
    private String workflowStatus = "NOT_TRIGGERED";

    @Column(name = "retry_count", nullable = false)
    private Integer retryCount = 0;

    @Column(name = "description")
    private String description;

    @Column(name = "detected_at", nullable = false)
    private LocalDateTime detectedAt;

    @Column(name = "resolved", nullable = false)
    private Boolean resolved = false;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    // Getters and Setters

    public Integer getEventId() {
        return eventId;
    }

    public void setEventId(Integer eventId) {
        this.eventId = eventId;
    }

    public Integer getDroneId() {
        return droneId;
    }

    public void setDroneId(Integer droneId) {
        this.droneId = droneId;
    }

    public Integer getMissionId() {
        return missionId;
    }

    public void setMissionId(Integer missionId) {
        this.missionId = missionId;
    }

    public Integer getTelemetryId() {
        return telemetryId;
    }

    public void setTelemetryId(Integer telemetryId) {
        this.telemetryId = telemetryId;
    }

    public Integer getSignalId() {
        return signalId;
    }

    public void setSignalId(Integer signalId) {
        this.signalId = signalId;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public java.math.BigDecimal getAnomalyScore() {
        return anomalyScore;
    }

    public void setAnomalyScore(java.math.BigDecimal anomalyScore) {
        this.anomalyScore = anomalyScore;
    }

    public Boolean getIsAnomaly() {
        return isAnomaly;
    }

    public void setIsAnomaly(Boolean isAnomaly) {
        this.isAnomaly = isAnomaly;
    }

    public String getRuleTriggered() {
        return ruleTriggered;
    }

    public void setRuleTriggered(String ruleTriggered) {
        this.ruleTriggered = ruleTriggered;
    }

    public String getActionTaken() {
        return actionTaken;
    }

    public void setActionTaken(String actionTaken) {
        this.actionTaken = actionTaken;
    }

    public String getWorkflowId() {
        return workflowId;
    }

    public void setWorkflowId(String workflowId) {
        this.workflowId = workflowId;
    }

    public String getWorkflowStatus() {
        return workflowStatus;
    }

    public void setWorkflowStatus(String workflowStatus) {
        this.workflowStatus = workflowStatus;
    }

    public Integer getRetryCount() {
        return retryCount;
    }

    public void setRetryCount(Integer retryCount) {
        this.retryCount = retryCount;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getDetectedAt() {
        return detectedAt;
    }

    public void setDetectedAt(LocalDateTime detectedAt) {
        this.detectedAt = detectedAt;
    }

    public Boolean getResolved() {
        return resolved;
    }

    public void setResolved(Boolean resolved) {
        this.resolved = resolved;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }
}
