package com.docqa.controller;

import com.docqa.service.RagProxyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class FileController {

    private final RagProxyService ragProxyService;

    @PostMapping("/upload")
    public ResponseEntity<?> upload(
            @RequestParam("file") MultipartFile file,
            @RequestHeader(value = "Authorization", defaultValue = "") String auth) {
        try {
            return ResponseEntity.ok(ragProxyService.uploadDocument(file, auth));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(java.util.Map.of("message", "Upload failed: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> list(
            @RequestHeader(value = "Authorization", defaultValue = "") String auth) {
        return ResponseEntity.ok(ragProxyService.getDocuments(auth));
    }

    @DeleteMapping("/{docId}")
    public ResponseEntity<?> delete(
            @PathVariable String docId,
            @RequestHeader(value = "Authorization", defaultValue = "") String auth) {
        return ResponseEntity.ok(ragProxyService.deleteDocument(docId, auth));
    }
}
