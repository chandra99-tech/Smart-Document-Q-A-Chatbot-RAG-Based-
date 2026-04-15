package com.docqa.controller;

import com.docqa.service.RagProxyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final RagProxyService ragProxyService;

    @PostMapping("/ask")
    public ResponseEntity<?> ask(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", defaultValue = "") String auth) {
        try {
            return ResponseEntity.ok(ragProxyService.ask(body, auth));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("message", "Query failed: " + e.getMessage()));
        }
    }

    @GetMapping("/history/{sessionId}")
    public ResponseEntity<?> history(
            @PathVariable String sessionId,
            @RequestHeader(value = "Authorization", defaultValue = "") String auth) {
        return ResponseEntity.ok(ragProxyService.getChatHistory(sessionId, auth));
    }

    @GetMapping("/sessions")
    public ResponseEntity<?> sessions(
            @RequestHeader(value = "Authorization", defaultValue = "") String auth) {
        return ResponseEntity.ok(ragProxyService.getSessions(auth));
    }

    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<?> deleteSession(
            @PathVariable String sessionId,
            @RequestHeader(value = "Authorization", defaultValue = "") String auth) {
        return ResponseEntity.ok(ragProxyService.deleteSession(sessionId, auth));
    }

    @GetMapping("/analytics")
    public ResponseEntity<?> analytics(
            @RequestHeader(value = "Authorization", defaultValue = "") String auth) {
        return ResponseEntity.ok(ragProxyService.getAnalytics(auth));
    }
}
