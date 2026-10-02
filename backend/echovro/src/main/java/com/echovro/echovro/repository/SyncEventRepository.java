package com.echovro.echovro.repository;

import com.echovro.echovro.model.SyncEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SyncEventRepository extends JpaRepository<SyncEvent, Long> {

    @Query("SELECT e FROM SyncEvent e WHERE e.toUser = :toUser AND e.delivered = false ORDER BY e.createdAt ASC")
    List<SyncEvent> findUndeliveredForUser(@Param("toUser") String toUser);
}
