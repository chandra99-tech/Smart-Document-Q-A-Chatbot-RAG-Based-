package com.docqa.controller;

import com.docqa.service.RagProxyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final RagProxyService ragProxyService;

    @GetMapping
    public ResponseEntity<?> analytics(
            @RequestHeader(value = "Authorization", defaultValue = "") String auth) {
        return ResponseEntity.ok(ragProxyService.getAnalytics(auth));
    }
}
