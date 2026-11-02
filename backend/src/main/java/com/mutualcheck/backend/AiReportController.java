// AI가 무슨 내용을 작성할지...
package com.mutualcheck.backend;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
public class AiReportController {

    private final OpenAiService openAiService;
    private final AiUsageLimiter aiUsageLimiter;
    private final AdminStatsRepository adminStatsRepository;
    private final AdminErrorLogRepository adminErrorLogRepository;

    public AiReportController(
            OpenAiService openAiService,
            AiUsageLimiter aiUsageLimiter,
            AdminStatsRepository adminStatsRepository,
            AdminErrorLogRepository adminErrorLogRepository
    ) {
        this.openAiService = openAiService;
        this.aiUsageLimiter = aiUsageLimiter;
        this.adminStatsRepository = adminStatsRepository;
        this.adminErrorLogRepository = adminErrorLogRepository;
    }

    @PostMapping("/api/ai-report")
    public AiReportResponse generateAiReport(@RequestBody AiReportRequest request) {

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
                buildAnalysisSummary(request);

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
                buildManageTip(request);

        String report =
                aiReport.replaceAll(
                        "(?s)3\\. 관리 팁:.*",
                        "3. 관리 팁:\n" + fixedManageTip
                );

        return new AiReportResponse(report);
    }

    private String buildAnalysisSummary(AiReportRequest request) {
        StringBuilder builder = new StringBuilder();

        builder.append("다음은 Twitter/X 맞팔 분석 결과다.\n\n");

        builder.append("AI 리포트 목적:\n");
        builder.append("- 사용자가 막대그래프와 상세 데이터를 직접 계산하지 않아도 되도록 확인 효율을 분석한다.\n");
        builder.append("- 전체 비맞팔 계정을 어느 생성 연도부터 확인하면 효율적인지 숫자 근거로 설명한다.\n");
        builder.append("- 핵심 인사이트와 종합 평가는 생성 연도 기준으로 작성한다.\n");
        builder.append("- 관리 팁은 작성하지 않는다.\n");
        builder.append("- 원인 추측이 아니라 집계된 분포만 근거로 작성한다.\n\n");

        builder.append("전체 집계 결과:\n");
        builder.append("- 전체 팔로워 수: ")
                .append(request.followersCount())
                .append("\n");

        builder.append("- 전체 팔로잉 수: ")
                .append(request.followingCount())
                .append("\n");

        builder.append("- 맞팔 수: ")
                .append(request.mutualCount())
                .append("\n");

        builder.append("- 비맞팔 수: ")
                .append(request.nonMutualCount())
                .append("\n");

        builder.append("- 맞팔률: ")
                .append(formatRate(request.mutualRate()))
                .append("%\n\n");

        builder.append("가장 중요한 데이터 - 전체 비맞팔 연도별 분포:\n");

        if (request.nonMutualYearStats() == null
                || request.nonMutualYearStats().isEmpty()) {

            builder.append("- 전체 비맞팔 연도별 데이터 없음\n\n");

        } else {

            for (NonMutualYearStatRequest yearStat
                    : request.nonMutualYearStats()) {

                builder.append("- ")
                        .append(yearStat.year())
                        .append("년: 비맞팔 ")
                        .append(yearStat.totalCount())
                        .append("명, 누적 확인 가능 비맞팔 ")
                        .append(yearStat.coverageCount())
                        .append("명(")
                        .append(yearStat.coverageRateText())
                        .append(")\n");
            }

            builder.append("\n");
        }

        builder.append("보조 데이터 - 계정 생성 구간별 분포:\n");

        if (request.ageGroups() == null
                || request.ageGroups().isEmpty()) {

            builder.append("- 구간별 데이터 없음\n\n");

        } else {

            for (AgeGroupRequest group : request.ageGroups()) {

                builder.append("- ")
                        .append(group.label())
                        .append(": 전체 ")
                        .append(group.totalCount())
                        .append("명, 맞팔 ")
                        .append(group.mutualCount())
                        .append("명, 비맞팔 ")
                        .append(group.nonMutualCount())
                        .append("명, 구간 내 비맞팔률 ")
                        .append(group.nonMutualRateText())
                        .append("\n");

                if (group.yearStats() != null
                        && !group.yearStats().isEmpty()) {

                    builder.append("  연도별 상세:\n");

                    for (YearStatRequest yearStat : group.yearStats()) {

                        builder.append("  - ")
                                .append(yearStat.year())
                                .append("년: 전체 ")
                                .append(yearStat.totalCount())
                                .append("명, 맞팔 ")
                                .append(yearStat.mutualCount())
                                .append("명, 비맞팔 ")
                                .append(yearStat.nonMutualCount())
                                .append("명\n");
                    }
                }
            }

            builder.append("\n");
        }

        builder.append("""
                
                아래 형식으로만 작성해라.

                1. 핵심 인사이트:
                - 첫 번째 핵심 인사이트
                - 두 번째 핵심 인사이트
                - 세 번째 핵심 인사이트
                - 네 번째 핵심 인사이트

                2. 종합 평가:
                한 문단으로 작성

                3. 관리 팁:
                관리 팁은 작성하지 말고 제목만 출력해라.

                ==========================
                핵심 인사이트 작성 규칙
                ==========================

                핵심 인사이트는 반드시 아래 순서를 지켜 작성한다.

                ① 첫 번째
                - 전체 비맞팔이 가장 많이 발생한 생성 연도를 설명한다.
                - 반드시 아래 형식을 사용한다.
                - "전체 비맞팔 N명 중 A년 생성 계정이 M명(P%)으로 가장 많습니다."

                ② 두 번째
                - 생성 연도 상위 2개를 합친 결과를 설명한다.
                - 반드시 아래 형식을 사용한다.
                - "A년과 B년 생성 계정만 확인해도 전체 비맞팔 N명 중 M명(P%)을 확인할 수 있습니다."

                ③ 세 번째
                - 생성 연도 상위 3개를 합친 결과를 설명한다.
                - 반드시 아래 형식을 사용한다.
                - "A년, B년, C년 생성 계정까지 확인하면 전체 비맞팔 N명 중 M명(P%)을 확인할 수 있습니다."

                ④ 네 번째
                - 상위 생성 연도를 확인했을 때 얻을 수 있는 확인 효율을 설명한다.
                - 첫 번째, 두 번째, 세 번째 인사이트와 같은 문장을 반복하지 않는다.
                - 생성 연도를 화살표(→)로 나열하지 않는다.
                - 상위 생성 연도에 비맞팔 계정이 집중되어 있어 확인 범위를 줄일 수 있다는 의미를 설명한다.
                
                ==========================
                종합 평가 작성 규칙
                ==========================

                - 핵심 인사이트 내용을 그대로 반복하지 않는다.
                - 생성 연도 분포가 특정 연도에 집중되어 있는지 여부를 한 번만 설명한다.
                - 확인 효율이 높다는 점을 한 문장으로 설명한다.
                - 2~3문장으로 작성한다.

                ==========================
                절대 금지
                ==========================

                - 관리 팁 본문 작성 금지
                - "누적 비맞팔 6명 가운데" 같은 표현 금지
                - "4~6년 구간", "7년 이상 구간" 중심 설명 금지
                - 같은 내용을 반복 금지
                - 그래프에 있는 숫자만 그대로 나열하지 말 것
                - 추측 금지
                - 제공되지 않은 연도 사용 금지
                - 제공되지 않은 구간명 사용 금지
                - 제공되지 않은 비율 생성 금지
                - 자동 언팔 추천 금지
                - 특정 계정을 비정상이라고 단정 금지

                ==========================
                작성 조건
                ==========================

                - 한국어 작성
                - 핵심 인사이트는 반드시 4줄
                - 종합 평가는 2~3문장
                - 모든 수치는 제공된 데이터만 사용한다.
                """);

        return builder.toString();
    }

    private String buildManageTip(AiReportRequest request) {
        List<NonMutualYearStatRequest> years =
                request.nonMutualYearStats();

        if (years == null || years.isEmpty()) {
            return "연도별 비맞팔 데이터가 없어 우선 확인할 계정을 정하기 어렵습니다.";
        }

        NonMutualYearStatRequest first =
                years.get(0);

        if (years.size() == 1) {
            return first.year()
                    + "년 생성 계정에서 비맞팔이 "
                    + first.totalCount()
                    + "명으로 확인됩니다. "
                    + "해당 연도의 계정부터 확인하면 비맞팔 계정을 효율적으로 검토할 수 있습니다.";
        }

        int limit =
                Math.min(3, years.size());

        NonMutualYearStatRequest last =
                years.get(limit - 1);

        return "비맞팔 계정 수가 많은 생성연도부터 확인해보세요. "
                + "특히 "
                + first.year()
                + "년 생성 계정이 "
                + first.totalCount()
                + "명으로 가장 많아 우선 확인하기 좋습니다. "
                + "상위 "
                + limit
                + "개 생성연도만 확인해도 전체 비맞팔 "
                + request.nonMutualCount()
                + "명 중 "
                + last.coverageCount()
                + "명("
                + last.coverageRateText()
                + ")을 검토할 수 있습니다.";
    }

    private String formatRate(double rate) {
        if (rate == Math.floor(rate)) {
            return String.valueOf(
                    (int) rate
            );
        }

        return String.format(
                "%.1f",
                rate
        );
    }

    public record AiReportRequest(
            int followersCount,
            int followingCount,
            int mutualCount,
            int nonMutualCount,
            double mutualRate,
            List<NonMutualYearStatRequest> nonMutualYearStats,
            List<AgeGroupRequest> ageGroups
    ) {
    }

    public record NonMutualYearStatRequest(
            String year,
            int totalCount,
            int coverageCount,
            double coverageRate,
            String coverageRateText
    ) {
    }

    public record AgeGroupRequest(
            String label,
            int totalCount,
            int mutualCount,
            int nonMutualCount,
            double nonMutualRate,
            String nonMutualRateText,
            List<YearStatRequest> yearStats
    ) {
    }

    public record YearStatRequest(
            String year,
            int totalCount,
            int mutualCount,
            int nonMutualCount
    ) {
    }

    public record AiReportResponse(
            String report
    ) {
    }
}