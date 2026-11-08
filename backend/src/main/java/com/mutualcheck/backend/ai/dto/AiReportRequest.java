// AI 분석 요청 데이터
package com.mutualcheck.backend.ai.dto;

import java.util.List;

public record AiReportRequest(
        int followersCount,
        int followingCount,
        int mutualCount,
        int nonMutualCount,
        double mutualRate,
        List<NonMutualYearStatRequest> nonMutualYearStats,
        List<AgeGroupRequest> ageGroups
) {

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
}
