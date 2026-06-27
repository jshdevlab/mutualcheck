package com.mutualcheck.backend;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
public class AiReportController {

    private final OpenAiService openAiService;

    public AiReportController(OpenAiService openAiService) {
        this.openAiService = openAiService;
    }

    @PostMapping("/api/ai-report")
    public AiReportResponse generateAiReport(@RequestBody AiReportRequest request) {
        String analysisSummary = buildAnalysisSummary(request);
        String report = openAiService.generateReport(analysisSummary);

        return new AiReportResponse(report);
    }

    private String buildAnalysisSummary(AiReportRequest request) {
        StringBuilder builder = new StringBuilder();

        builder.append("다음은 Twitter/X 맞팔 분석 결과다.\n\n");

        builder.append("분석 기준:\n");
        builder.append("- 사용자가 업로드한 팔로잉 파일과 팔로워 파일 2개를 비교한 결과\n");
        builder.append("- 원본 계정 목록 전체를 AI에 넘기지 않고, 집계된 결과만 사용\n");
        builder.append("- AI는 자동 판단이 아니라 사용자의 의사결정을 보조하는 리포트만 작성\n\n");

        builder.append("전체 집계 결과:\n");
        builder.append("- 전체 팔로워 수: ").append(request.followersCount()).append("\n");
        builder.append("- 전체 팔로잉 수: ").append(request.followingCount()).append("\n");
        builder.append("- 맞팔 수: ").append(request.mutualCount()).append("\n");
        builder.append("- 비맞팔 수: ").append(request.nonMutualCount()).append("\n");
        builder.append("- 맞팔률: ").append(request.mutualRate()).append("%\n\n");

        builder.append("계정 생성 구간별 분포:\n");

        if (request.ageGroups() == null || request.ageGroups().isEmpty()) {
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
            }

            builder.append("\n");
        }

        builder.append("""
                
                위 데이터를 바탕으로 아래 형식으로 작성해라.

                1. 핵심 인사이트:
                - 첫 번째 핵심 인사이트
                - 두 번째 핵심 인사이트
                - 세 번째 핵심 인사이트
                - 네 번째 핵심 인사이트

                2. 종합 평가:
                한 문단으로 작성

                3. 관리 팁:
                한 문단으로 작성

                조건:
                - 한국어로 작성
                - 핵심 인사이트는 반드시 4개 작성
                - 각 핵심 인사이트는 한 줄씩 작성
                - 종합 평가는 2~3문장으로 작성
                - 관리 팁은 1~2문장으로 작성

                데이터 해석 규칙:
                - 화면에 이미 표시되는 전체 수치만 그대로 반복하지 말 것
                - 계정 생성 구간별 분포를 중심으로 해석할 것
                - 반드시 제공된 구간명만 사용할 것: 1개월 미만, 1~5개월, 6~11개월, 1~3년, 4~6년, 7년 이상
                - 제공되지 않은 구간명(예: 1년 미만, 3년 이상, 5년 이상)을 새로 만들지 말 것
                - 제공된 구간을 합치거나 나누지 말 것
                - 제공된 구간별 수치만 근거로 분석할 것
                - 구간별 비맞팔률은 반드시 제공된 값을 그대로 사용할 것
                - 새로운 비율을 계산하거나 추정하지 말 것
                - 제공되지 않은 비율을 만들어 쓰지 말 것
                - 비맞팔이 0명이 아닌 구간을 "없다"고 표현하지 말 것
                - 비맞팔이 가장 많은 구간과 비맞팔률이 가장 높은 구간은 구분해서 설명할 것
                - 그래프에서 확인 가능한 패턴과 차이를 해석하는 역할만 수행할 것

                안전 조건:
                - 과장 금지
                - 자동 언팔로우 추천 금지
                - 특정 계정을 단정적으로 비정상 계정이라고 판단하지 말 것
                - 사용자가 직접 판단할 수 있도록 보조 설명만 제공
                """);

        return builder.toString();
    }

    public record AiReportRequest(
            int followersCount,
            int followingCount,
            int mutualCount,
            int nonMutualCount,
            double mutualRate,
            List<AgeGroupRequest> ageGroups
    ) {
    }

    public record AgeGroupRequest(
            String label,
            int totalCount,
            int mutualCount,
            int nonMutualCount,
            double nonMutualRate,
            String nonMutualRateText
    ) {
    }

    public record AiReportResponse(
            String report
    ) {
    }
}