package com.echovro.echovro.repository;

import com.echovro.echovro.model.SongSnap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SongSnapRepository extends JpaRepository<SongSnap, Long> {

    @Query("SELECT s FROM SongSnap s WHERE (s.sender = :u1 AND s.recipient = :u2) OR (s.sender = :u2 AND s.recipient = :u1) ORDER BY s.createdAt ASC")
    List<SongSnap> findConversationSnaps(@Param("u1") String u1, @Param("u2") String u2);

    List<SongSnap> findByRecipientOrSenderOrderByCreatedAtDesc(String recipient, String sender);
}
