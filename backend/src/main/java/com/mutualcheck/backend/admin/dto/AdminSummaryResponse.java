// 관리자 요약 통계 DTO
package com.mutualcheck.backend.admin.dto;

import java.math.BigDecimal;

public record AdminSummaryResponse(
        long todayAnalysisCount,
        long monthAnalysisCount,
        int todayAiCallCount,
        int monthAiCallCount,
        int dailyAiLimit,
        int monthlyAiLimit,
        long aiSuccessCount,
        long aiFailureCount,
        long aiBlockedCount,
        BigDecimal monthAiCostUsd
) {
}
