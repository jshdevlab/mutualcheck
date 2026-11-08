// AI 제한 확인, 리포트 생성, 통계·오류 처리
package com.mutualcheck.backend.ai;

import com.mutualcheck.backend.admin.AdminErrorLogRepository;
import com.mutualcheck.backend.admin.AdminStatsRepository;
import com.mutualcheck.backend.ai.dto.AiReportRequest;
import com.mutualcheck.backend.ai.dto.AiReportResponse;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AiReportService {

    private final OpenAiService openAiService;
    private final AiUsageLimiter aiUsageLimiter;
    private final AdminStatsRepository adminStatsRepository;
    private final AdminErrorLogRepository adminErrorLogRepository;
    private final AiReportPromptBuilder aiReportPromptBuilder;

    public AiReportService(
            OpenAiService openAiService,
            AiUsageLimiter aiUsageLimiter,
            AdminStatsRepository adminStatsRepository,
            AdminErrorLogRepository adminErrorLogRepository,
            AiReportPromptBuilder aiReportPromptBuilder
    ) {
        this.openAiService = openAiService;
        this.aiUsageLimiter = aiUsageLimiter;
        this.adminStatsRepository = adminStatsRepository;
        this.adminErrorLogRepository = adminErrorLogRepository;
        this.aiReportPromptBuilder = aiReportPromptBuilder;
    }

    public AiReportResponse generateAiReport(AiReportRequest request) {

        AiUsageLimiter.AcquireResult acquireResult =
                aiUsageLimiter.tryAcquire();

        if (acquireResult == AiUsageLimiter.AcquireResult.DAILY_LIMIT_REACHED) {

            try {
                adminStatsRepository.incrementAiBlockedCount();
            } catch (Exception e) {
                System.err.println(
                        "AI 일일 한도 차단 통계 저장 실패: "
                                + e.getMessage()
                );
            }

            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "오늘 AI 분석 한도에 도달했습니다."
            );
        }

        if (acquireResult == AiUsageLimiter.AcquireResult.MONTHLY_LIMIT_REACHED) {

            try {
                adminStatsRepository.incrementAiBlockedCount();
            } catch (Exception e) {
                System.err.println(
                        "AI 월간 한도 차단 통계 저장 실패: "
                                + e.getMessage()
                );
            }

            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "이번 달 AI 분석 한도에 도달했습니다."
            );
        }

        String analysisSummary =
                aiReportPromptBuilder.buildAnalysisSummary(request);

        OpenAiService.OpenAiResult openAiResult;

        try {
            openAiResult =
                    openAiService.generateReport(
                            analysisSummary
                    );

        } catch (Exception e) {

            try {
                adminStatsRepository.incrementAiFailureCount();
            } catch (Exception statsException) {
                System.err.println(
                        "AI 실패 통계 저장 실패: "
                                + statsException.getMessage()
                );
            }

            try {
                adminErrorLogRepository.saveError(
                        AdminErrorLogRepository.ErrorType.AI,
                        "AI 리포트 생성 중 오류가 발생했습니다."
                );
            } catch (Exception logException) {
                System.err.println(
                        "AI 오류 로그 저장 실패: "
                                + logException.getMessage()
                );
            }

            throw e;
        }

        try {
            adminStatsRepository.incrementAiSuccessCount();
        } catch (Exception e) {
            System.err.println(
                    "AI 성공 통계 저장 실패: "
                            + e.getMessage()
            );
        }

        try {
            adminStatsRepository.addAiUsage(
                    openAiResult.inputTokens(),
                    openAiResult.cachedInputTokens(),
                    openAiResult.outputTokens()
            );
        } catch (Exception e) {
            System.err.println(
                    "AI 토큰 사용량 저장 실패: "
                            + e.getMessage()
            );
        }

        String aiReport =
                openAiResult.report();

        String fixedManageTip =
                aiReportPromptBuilder.buildManageTip(request);

        String report =
                aiReport.replaceAll(
                        "(?s)3\\. 관리 팁:.*",
                        "3. 관리 팁:\n" + fixedManageTip
                );

        return new AiReportResponse(report);
    }

}
