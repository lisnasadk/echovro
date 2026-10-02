package com.echovro.echovro.dto;

public class SyncEventDto {
    private Long id;
    private String from;
    private String to;
    private String eventType;
    private String payload;
    private Long createdAt;

    public SyncEventDto() {}

    public SyncEventDto(Long id, String from, String to, String eventType, String payload, Long createdAt) {
        this.id = id;
        this.from = from;
        this.to = to;
        this.eventType = eventType;
        this.payload = payload;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFrom() {
        return from;
    }

    public void setFrom(String from) {
        this.from = from;
    }

    public String getTo() {
        return to;
    }

    public void setTo(String to) {
        this.to = to;
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

    public Long getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Long createdAt) {
        this.createdAt = createdAt;
    }
}
