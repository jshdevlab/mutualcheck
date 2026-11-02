package com.mutualcheck.backend;

import org.springframework.stereotype.Service;

@Service
public class AiUsageLimiter {

    private static final int DAILY_LIMIT = 300;
    private static final int MONTHLY_LIMIT = 5000;

    private final AiUsageRepository aiUsageRepository;

    public AiUsageLimiter(AiUsageRepository aiUsageRepository) {
        this.aiUsageRepository = aiUsageRepository;
    }

    public AcquireResult tryAcquire() {

        AiUsageRepository.AcquireResult result =
                aiUsageRepository.tryAcquire(
                        DAILY_LIMIT,
                        MONTHLY_LIMIT
                );

        return switch (result) {
            case ALLOWED -> AcquireResult.ALLOWED;
            case DAILY_LIMIT_REACHED -> AcquireResult.DAILY_LIMIT_REACHED;
            case MONTHLY_LIMIT_REACHED -> AcquireResult.MONTHLY_LIMIT_REACHED;
        };
    }

    public int getDailyCount() {
        return aiUsageRepository.getDailyCount();
    }

    public int getMonthlyCount() {
        return aiUsageRepository.getMonthlyCount();
    }

    public int getDailyLimit() {
        return DAILY_LIMIT;
    }

    public int getMonthlyLimit() {
        return MONTHLY_LIMIT;
    }

    public enum AcquireResult {
        ALLOWED,
        DAILY_LIMIT_REACHED,
        MONTHLY_LIMIT_REACHED
    }
}