package com.echovro.echovro.repository;

import com.echovro.echovro.model.Connection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConnectionRepository extends JpaRepository<Connection, Long> {

    @Query("SELECT c FROM Connection c WHERE (c.fromUser = :u1 AND c.toUser = :u2) OR (c.fromUser = :u2 AND c.toUser = :u1)")
    Optional<Connection> findBetweenUsers(@Param("u1") String u1, @Param("u2") String u2);

    @Query("SELECT c FROM Connection c WHERE c.fromUser = :user OR c.toUser = :user")
    List<Connection> findAllForUser(@Param("user") String user);
}
