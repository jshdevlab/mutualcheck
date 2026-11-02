package com.mutualcheck.backend;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/admin")
public class AdminStatsController {

    private static final ZoneId KOREA_ZONE =
            ZoneId.of("Asia/Seoul");

    private final AdminStatsRepository adminStatsRepository;
    private final AiUsageRepository aiUsageRepository;
    private final AiUsageLimiter aiUsageLimiter;

    public AdminStatsController(
            AdminStatsRepository adminStatsRepository,
            AiUsageRepository aiUsageRepository,
            AiUsageLimiter aiUsageLimiter
    ) {
        this.adminStatsRepository = adminStatsRepository;
        this.aiUsageRepository = aiUsageRepository;
        this.aiUsageLimiter = aiUsageLimiter;
    }

    @GetMapping("/summary")
    public SummaryResponse getSummary() {

        LocalDate today =
                LocalDate.now(KOREA_ZONE);

        YearMonth currentMonth =
                YearMonth.from(today);

        List<LocalDate> dates =
                createDateRange(
                        currentMonth,
                        today.getDayOfMonth()
                );

        Map<LocalDate, AdminStatsRepository.DailyUsage> usages =
                adminStatsRepository.getDailyUsages(dates);

        AdminStatsRepository.DailyUsage todayUsage =
                usages.get(today);

        long monthAnalysisCount = 0;
        long monthAiSuccessCount = 0;
        long monthAiFailureCount = 0;
        long monthAiBlockedCount = 0;

        BigDecimal monthAiCostUsd =
                BigDecimal.ZERO;

        for (LocalDate date : dates) {

            AdminStatsRepository.DailyUsage usage =
                    usages.get(date);

            monthAnalysisCount +=
                    usage.analysisCount();

            monthAiSuccessCount +=
                    usage.aiSuccessCount();

            monthAiFailureCount +=
                    usage.aiFailureCount();

            monthAiBlockedCount +=
                    usage.aiBlockedCount();

            monthAiCostUsd =
                    monthAiCostUsd.add(
                            usage.aiCostUsd()
                    );
        }

        int todayAiCallCount =
                aiUsageRepository.getDailyCount(today);

        int monthAiCallCount =
                aiUsageRepository.getMonthlyCount(
                        currentMonth
                );

        return new SummaryResponse(
                todayUsage.analysisCount(),
                monthAnalysisCount,

                todayAiCallCount,
                monthAiCallCount,

                aiUsageLimiter.getDailyLimit(),
                aiUsageLimiter.getMonthlyLimit(),

                monthAiSuccessCount,
                monthAiFailureCount,
                monthAiBlockedCount,

                monthAiCostUsd
        );
    }

    @GetMapping("/monthly")
    public MonthlyResponse getMonthly(
            @RequestParam
            @DateTimeFormat(pattern = "yyyy-MM")
            YearMonth month
    ) {

        List<LocalDate> dates =
                createDateRange(
                        month,
                        month.lengthOfMonth()
                );

        Map<LocalDate, AdminStatsRepository.DailyUsage> usages =
                adminStatsRepository.getDailyUsages(dates);

        Map<LocalDate, Integer> aiCounts =
                aiUsageRepository.getDailyCounts(dates);

        List<TrendData> analysisTrend =
                new ArrayList<>();

        List<TrendData> aiTrend =
                new ArrayList<>();

        for (LocalDate date : dates) {

            AdminStatsRepository.DailyUsage usage =
                    usages.get(date);

            analysisTrend.add(
                    new TrendData(
                            String.format(
                                    "%02d.%02d",
                                    date.getMonthValue(),
                                    date.getDayOfMonth()
                            ),
                            usage.analysisCount()
                    )
            );

            aiTrend.add(
                    new TrendData(
                            String.format(
                                    "%02d.%02d",
                                    date.getMonthValue(),
                                    date.getDayOfMonth()
                            ),
                            aiCounts.getOrDefault(
                                    date,
                                    0
                            )
                    )
            );
        }

        return new MonthlyResponse(
                analysisTrend,
                aiTrend
        );
    }

    @GetMapping("/yearly")
    public YearlyResponse getYearly(
            @RequestParam int year
    ) {

        List<LocalDate> yearDates =
                createYearDateRange(year);

        Map<LocalDate, AdminStatsRepository.DailyUsage> usages =
                adminStatsRepository.getDailyUsages(yearDates);

        List<YearMonth> yearMonths =
                createYearMonthRange(year);

        Map<YearMonth, Integer> aiCounts =
                aiUsageRepository.getMonthlyCounts(
                        yearMonths
                );

        List<TrendData> analysisTrend =
                new ArrayList<>();

        List<TrendData> aiTrend =
                new ArrayList<>();

        for (YearMonth targetMonth : yearMonths) {

            long analysisCount = 0;

            for (int day = 1;
                 day <= targetMonth.lengthOfMonth();
                 day++) {

                LocalDate date =
                        targetMonth.atDay(day);

                AdminStatsRepository.DailyUsage usage =
                        usages.get(date);

                analysisCount +=
                        usage.analysisCount();
            }

            analysisTrend.add(
                    new TrendData(
                            String.format(
                                    "%02d",
                                    targetMonth.getMonthValue()
                            ),
                            analysisCount
                    )
            );

            aiTrend.add(
                    new TrendData(
                            String.format(
                                    "%02d",
                                    targetMonth.getMonthValue()
                            ),
                            aiCounts.getOrDefault(
                                    targetMonth,
                                    0
                            )
                    )
            );
        }

        return new YearlyResponse(
                analysisTrend,
                aiTrend
        );
    }

    private List<LocalDate> createDateRange(
            YearMonth month,
            int lastDay
    ) {

        List<LocalDate> dates =
                new ArrayList<>();

        for (int day = 1;
             day <= lastDay;
             day++) {

            dates.add(
                    month.atDay(day)
            );
        }

        return dates;
    }

    private List<LocalDate> createYearDateRange(
            int year
    ) {

        List<LocalDate> dates =
                new ArrayList<>();

        for (int monthNumber = 1;
             monthNumber <= 12;
             monthNumber++) {

            YearMonth month =
                    YearMonth.of(
                            year,
                            monthNumber
                    );

            for (int day = 1;
                 day <= month.lengthOfMonth();
                 day++) {

                dates.add(
                        month.atDay(day)
                );
            }
        }

        return dates;
    }

    private List<YearMonth> createYearMonthRange(
            int year
    ) {

        List<YearMonth> months =
                new ArrayList<>();

        for (int monthNumber = 1;
             monthNumber <= 12;
             monthNumber++) {

            months.add(
                    YearMonth.of(
                            year,
                            monthNumber
                    )
            );
        }

        return months;
    }

    public record SummaryResponse(
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

    public record MonthlyResponse(
            List<TrendData> analysisTrend,
            List<TrendData> aiTrend
    ) {
    }

    public record YearlyResponse(
            List<TrendData> analysisTrend,
            List<TrendData> aiTrend
    ) {
    }

    public record TrendData(
            String date,
            long count
    ) {
    }
}