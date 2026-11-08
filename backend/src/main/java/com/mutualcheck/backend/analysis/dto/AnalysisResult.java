// 분석 결과 데이터
package com.mutualcheck.backend.analysis.dto;

import java.util.List;
import java.util.Map;

public record AnalysisResult(
        String status,
        String message,
        int followersCount,
        int followingCount,
        int mutualCount,
        int nonMutualCount,
        double mutualRate,
        List<Map<String, String>> mutualAccounts,
        List<Map<String, String>> nonMutualAccounts,
        List<Map<String, Object>> ageGroups,
        List<Map<String, Object>> nonMutualYearStats
) {
}
