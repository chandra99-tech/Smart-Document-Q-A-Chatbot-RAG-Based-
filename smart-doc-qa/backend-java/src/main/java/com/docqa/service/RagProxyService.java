package com.docqa.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RagProxyService {

    @Value("${rag.service.base-url}")
    private String ragBaseUrl;

    private WebClient webClient() {
        return WebClient.builder()
            .baseUrl(ragBaseUrl)
            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
            .build();
    }

    /** Forward file upload to the Python RAG service. */
    public Map<?, ?> uploadDocument(MultipartFile file, String bearerToken) throws IOException {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
            @Override public String getFilename() { return file.getOriginalFilename(); }
        };
        body.add("file", resource);

        return WebClient.builder().baseUrl(ragBaseUrl).build()
            .post().uri("/documents/upload")
            .header(HttpHeaders.AUTHORIZATION, bearerToken)
            .contentType(MediaType.MULTIPART_FORM_DATA)
            .body(BodyInserters.fromMultipartData(body))
            .retrieve()
            .bodyToMono(Map.class)
            .block();
    }

    /** Get document list from Python service. */
    public Object getDocuments(String bearerToken) {
        return webClient().get().uri("/documents")
            .header(HttpHeaders.AUTHORIZATION, bearerToken)
            .retrieve().bodyToMono(Object.class).block();
    }

    /** Delete a document from Python service. */
    public Object deleteDocument(String docId, String bearerToken) {
        return webClient().delete().uri("/documents/" + docId)
            .header(HttpHeaders.AUTHORIZATION, bearerToken)
            .retrieve().bodyToMono(Object.class).block();
    }

    /** Ask a question via the Python RAG pipeline. */
    public Object ask(Map<String, Object> payload, String bearerToken) {
        return webClient().post().uri("/chat/ask")
            .header(HttpHeaders.AUTHORIZATION, bearerToken)
            .bodyValue(payload)
            .retrieve()
            .bodyToMono(Object.class)
            .block();
    }

    /** Fetch chat history for a session. */
    public Object getChatHistory(String sessionId, String bearerToken) {
        return webClient().get().uri("/chat/history/" + sessionId)
            .header(HttpHeaders.AUTHORIZATION, bearerToken)
            .retrieve().bodyToMono(Object.class).block();
    }

    /** List all sessions. */
    public Object getSessions(String bearerToken) {
        return webClient().get().uri("/chat/sessions")
            .header(HttpHeaders.AUTHORIZATION, bearerToken)
            .retrieve().bodyToMono(Object.class).block();
    }

    /** Delete a session. */
    public Object deleteSession(String sessionId, String bearerToken) {
        return webClient().delete().uri("/chat/sessions/" + sessionId)
            .header(HttpHeaders.AUTHORIZATION, bearerToken)
            .retrieve().bodyToMono(Object.class).block();
    }

    /** Get analytics data. */
    public Object getAnalytics(String bearerToken) {
        return webClient().get().uri("/analytics")
            .header(HttpHeaders.AUTHORIZATION, bearerToken)
            .retrieve().bodyToMono(Object.class).block();
    }
}
