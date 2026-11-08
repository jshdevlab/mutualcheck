// 월별·연도별 추이 DTO
package com.mutualcheck.backend.admin.dto;

import java.util.List;

public record AdminTrendResponse(
        List<TrendData> analysisTrend,
        List<TrendData> aiTrend
) {
    public record TrendData(
            String date,
            long count
    ) {
    }
}
