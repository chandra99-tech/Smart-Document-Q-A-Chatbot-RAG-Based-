package com.docqa.repository;

import com.docqa.model.ChatHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatHistoryRepository extends JpaRepository<ChatHistory, String> {

    List<ChatHistory> findBySessionIdOrderByCreatedAtAsc(String sessionId);

    @Query("SELECT DISTINCT c.sessionId FROM ChatHistory c WHERE c.user.id = :userId ORDER BY MAX(c.createdAt) DESC")
    List<String> findDistinctSessionIdsByUserId(String userId);

    void deleteBySessionId(String sessionId);
}
