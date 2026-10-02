package com.echovro.echovro.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "from_user", nullable = false)
    private String fromUser;

    @Column(name = "to_user", nullable = false)
    private String toUser;

    @Column(nullable = false, length = 2048)
    private String text;

    private LocalDateTime createdAt = LocalDateTime.now();

    public ChatMessage() {}

    public ChatMessage(String fromUser, String toUser, String text) {
        this.fromUser = fromUser;
        this.toUser = toUser;
        this.text = text;
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

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
