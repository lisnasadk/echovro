package com.echovro.echovro.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sync_events")
public class SyncEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "from_user", nullable = false)
    private String fromUser;

    @Column(name = "to_user", nullable = false)
    private String toUser;

    @Column(name = "event_type", nullable = false)
    private String eventType; // "request", "accepted", "message", "signal", "room"

    @Column(length = 4096)
    private String payload;

    private boolean delivered = false;

    private LocalDateTime createdAt = LocalDateTime.now();

    public SyncEvent() {}

    public SyncEvent(String fromUser, String toUser, String eventType, String payload) {
        this.fromUser = fromUser;
        this.toUser = toUser;
        this.eventType = eventType;
        this.payload = payload;
        this.delivered = false;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFromUser() {
        return fromUser;
    }

    public void setFromUser(String fromUser) {
        this.fromUser = fromUser;
    }

    public String getToUser() {
        return toUser;
    }

    public void setToUser(String toUser) {
        this.toUser = toUser;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getPayload() {
        return payload;
    }

    public void setPayload(String payload) {
        this.payload = payload;
    }

    public boolean isDelivered() {
        return delivered;
    }

    public void setDelivered(boolean delivered) {
        this.delivered = delivered;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
