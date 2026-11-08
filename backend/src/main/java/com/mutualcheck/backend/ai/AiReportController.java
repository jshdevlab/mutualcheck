// 	HTTP 요청·응답
package com.mutualcheck.backend.ai;

import com.mutualcheck.backend.ai.dto.AiReportRequest;
import com.mutualcheck.backend.ai.dto.AiReportResponse;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
public class AiReportController {

    private final AiReportService aiReportService;

    public AiReportController(AiReportService aiReportService) {
        this.aiReportService = aiReportService;
    }

    @PostMapping("/api/ai-report")
    public AiReportResponse generateAiReport(@RequestBody AiReportRequest request) {
        return aiReportService.generateAiReport(request);
    }
}
