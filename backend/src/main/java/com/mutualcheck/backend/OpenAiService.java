package com.mutualcheck.backend;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class OpenAiService {

    private final WebClient webClient;
    private final String model;

    public OpenAiService(
            @Value("${openai.api.key}") String apiKey,
            @Value("${openai.model}") String model
    ) {
        this.model = model;
        this.webClient = WebClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .defaultHeader("Content-Type", "application/json")
                .build();
    }

    public String generateReport(String analysisSummary) {
        Map<String, Object> requestBody = Map.of(
                "model", model,
                "input", List.of(
                        Map.of(
                                "role", "system",
                                "content", """
                                        너는 SNS 팔로우 관계 분석 리포트를 작성하는 분석가다.
                                        사용자가 판단하기 쉽게 짧고 명확한 한국어로 작성한다.
                                        과장하지 말고, 데이터에 근거해서만 작성한다.
                                        자동 언팔로우나 확정 판단은 절대 제안하지 않는다.
                                        """
                        ),
                        Map.of(
                                "role", "user",
                                "content", analysisSummary
                        )
                )
        );

        Map<?, ?> response = webClient.post()
                .uri("/responses")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        if (response == null) {
            return "AI 리포트를 생성하지 못했습니다.";
        }

        return extractOutputText(response);
    }

    private String extractOutputText(Map<?, ?> response) {
        Object output = response.get("output");

        if (!(output instanceof List<?> outputList)) {
            return "AI 응답 형식이 올바르지 않습니다.";
        }

        StringBuilder result = new StringBuilder();

        for (Object outputItem : outputList) {
            if (!(outputItem instanceof Map<?, ?> outputMap)) {
                continue;
            }

            Object content = outputMap.get("content");

            if (!(content instanceof List<?> contentList)) {
                continue;
            }

            for (Object contentItem : contentList) {
                if (!(contentItem instanceof Map<?, ?> contentMap)) {
                    continue;
                }

                Object text = contentMap.get("text");

                if (text instanceof String textValue) {
                    result.append(textValue);
                }
            }
        }

        if (result.isEmpty()) {
            return "AI 리포트 내용이 비어 있습니다.";
        }

        return result.toString();
    }
}