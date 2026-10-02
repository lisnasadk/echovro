package com.echovro.echovro.repository;

import com.echovro.echovro.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("SELECT m FROM ChatMessage m WHERE (m.fromUser = :u1 AND m.toUser = :u2) OR (m.fromUser = :u2 AND m.toUser = :u1) ORDER BY m.createdAt ASC")
    List<ChatMessage> findChatHistory(@Param("u1") String u1, @Param("u2") String u2);
}
