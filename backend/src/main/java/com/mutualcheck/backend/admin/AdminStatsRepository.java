// DynamoDB 통계 조회·저장
package com.mutualcheck.backend.admin;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Repository;

import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.BatchGetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.BatchGetItemResponse;
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.GetItemResponse;
import software.amazon.awssdk.services.dynamodb.model.KeysAndAttributes;
import software.amazon.awssdk.services.dynamodb.model.UpdateItemRequest;

@Repository
public class AdminStatsRepository {

    private static final String TABLE_NAME = "mutualcheck-admin";
    private static final ZoneId KOREA_ZONE = ZoneId.of("Asia/Seoul");

    private static final DateTimeFormatter DAY_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private static final DateTimeFormatter DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private static final BigDecimal ONE_MILLION =
            new BigDecimal("1000000");

    private static final BigDecimal INPUT_PRICE_PER_MILLION =
            new BigDecimal("0.15");

    private static final BigDecimal CACHED_INPUT_PRICE_PER_MILLION =
            new BigDecimal("0.075");

    private static final BigDecimal OUTPUT_PRICE_PER_MILLION =
            new BigDecimal("0.60");

    private final DynamoDbClient dynamoDbClient;

    public AdminStatsRepository(
            DynamoDbClient dynamoDbClient
    ) {
        this.dynamoDbClient = dynamoDbClient;
    }

    public void incrementAnalysisCount() {
        incrementCounter("analysisCount");
    }

    public void incrementAiSuccessCount() {
        incrementCounter("aiSuccessCount");
    }

    public void incrementAiFailureCount() {
        incrementCounter("aiFailureCount");
    }

    public void incrementAiBlockedCount() {
        incrementCounter("aiBlockedCount");
    }

    public void addAiUsage(
            long inputTokens,
            long cachedInputTokens,
            long outputTokens
    ) {
        LocalDate today =
                LocalDate.now(KOREA_ZONE);

        String pk =
                "USAGE#" + DAY_FORMATTER.format(today);

        String updatedAt =
                ZonedDateTime.now(KOREA_ZONE)
                        .format(DATE_TIME_FORMATTER);

        long normalInputTokens =
                Math.max(
                        inputTokens - cachedInputTokens,
                        0
                );

        BigDecimal normalInputCost =
                BigDecimal.valueOf(normalInputTokens)
                        .multiply(INPUT_PRICE_PER_MILLION)
                        .divide(ONE_MILLION);

        BigDecimal cachedInputCost =
                BigDecimal.valueOf(cachedInputTokens)
                        .multiply(CACHED_INPUT_PRICE_PER_MILLION)
                        .divide(ONE_MILLION);

        BigDecimal outputCost =
                BigDecimal.valueOf(outputTokens)
                        .multiply(OUTPUT_PRICE_PER_MILLION)
                        .divide(ONE_MILLION);

        BigDecimal aiCostUsd =
                normalInputCost
                        .add(cachedInputCost)
                        .add(outputCost);

        UpdateItemRequest request =
                UpdateItemRequest.builder()
                        .tableName(TABLE_NAME)
                        .key(Map.of(
                                "pk",
                                AttributeValue.builder()
                                        .s(pk)
                                        .build(),

                                "sk",
                                AttributeValue.builder()
                                        .s("SUMMARY")
                                        .build()
                        ))
                        .updateExpression(
                                "SET #inputTokens = if_not_exists(#inputTokens, :zero) + :inputTokens, " +
                                "#cachedInputTokens = if_not_exists(#cachedInputTokens, :zero) + :cachedInputTokens, " +
                                "#outputTokens = if_not_exists(#outputTokens, :zero) + :outputTokens, " +
                                "#aiCostUsd = if_not_exists(#aiCostUsd, :zero) + :aiCostUsd, " +
                                "#updatedAt = :updatedAt"
                        )
                        .expressionAttributeNames(Map.of(
                                "#inputTokens",
                                "inputTokens",

                                "#cachedInputTokens",
                                "cachedInputTokens",

                                "#outputTokens",
                                "outputTokens",

                                "#aiCostUsd",
                                "aiCostUsd",

                                "#updatedAt",
                                "updatedAt"
                        ))
                        .expressionAttributeValues(Map.of(
                                ":zero",
                                AttributeValue.builder()
                                        .n("0")
                                        .build(),

                                ":inputTokens",
                                AttributeValue.builder()
                                        .n(String.valueOf(inputTokens))
                                        .build(),

                                ":cachedInputTokens",
                                AttributeValue.builder()
                                        .n(String.valueOf(cachedInputTokens))
                                        .build(),

                                ":outputTokens",
                                AttributeValue.builder()
                                        .n(String.valueOf(outputTokens))
                                        .build(),

                                ":aiCostUsd",
                                AttributeValue.builder()
                                        .n(aiCostUsd.toPlainString())
                                        .build(),

                                ":updatedAt",
                                AttributeValue.builder()
                                        .s(updatedAt)
                                        .build()
                        ))
                        .build();

        dynamoDbClient.updateItem(request);
    }

    public DailyUsage getDailyUsage(
            LocalDate date
    ) {
        String pk =
                "USAGE#" + DAY_FORMATTER.format(date);

        GetItemRequest request =
                GetItemRequest.builder()
                        .tableName(TABLE_NAME)
                        .key(Map.of(
                                "pk",
                                AttributeValue.builder()
                                        .s(pk)
                                        .build(),

                                "sk",
                                AttributeValue.builder()
                                        .s("SUMMARY")
                                        .build()
                        ))
                        .consistentRead(true)
                        .build();

        GetItemResponse response =
                dynamoDbClient.getItem(request);

        Map<String, AttributeValue> item =
                response.item();

        if (item == null || item.isEmpty()) {
            return createEmptyDailyUsage(date);
        }

        return toDailyUsage(date, item);
    }

    public Map<LocalDate, DailyUsage> getDailyUsages(
            List<LocalDate> dates
    ) {
        Map<LocalDate, DailyUsage> result =
                new HashMap<>();

        if (dates == null || dates.isEmpty()) {
            return result;
        }

        /*
         * DynamoDB BatchGetItem은 한 요청당 최대 100개의 키를
         * 조회할 수 있으므로 100개 단위로 나눈다.
         */
        for (int start = 0;
             start < dates.size();
             start += 100) {

            int end =
                    Math.min(
                            start + 100,
                            dates.size()
                    );

            List<LocalDate> batchDates =
                    dates.subList(start, end);

            loadBatch(
                    batchDates,
                    result
            );
        }

        /*
         * DynamoDB에 데이터가 존재하지 않는 날짜도
         * 호출 측에서 null 체크 없이 사용할 수 있도록
         * 0값 DailyUsage를 채운다.
         */
        for (LocalDate date : dates) {
            result.putIfAbsent(
                    date,
                    createEmptyDailyUsage(date)
            );
        }

        return result;
    }

    private void loadBatch(
            List<LocalDate> dates,
            Map<LocalDate, DailyUsage> result
    ) {
        List<Map<String, AttributeValue>> keys =
                new ArrayList<>();

        for (LocalDate date : dates) {

            String pk =
                    "USAGE#" + DAY_FORMATTER.format(date);

            keys.add(
                    Map.of(
                            "pk",
                            AttributeValue.builder()
                                    .s(pk)
                                    .build(),

                            "sk",
                            AttributeValue.builder()
                                    .s("SUMMARY")
                                    .build()
                    )
            );
        }

        KeysAndAttributes keysAndAttributes =
                KeysAndAttributes.builder()
                        .keys(keys)
                        .consistentRead(true)
                        .build();

        Map<String, KeysAndAttributes> requestItems =
                Map.of(
                        TABLE_NAME,
                        keysAndAttributes
                );

        /*
         * BatchGetItem은 처리하지 못한 키를
         * unprocessedKeys로 반환할 수 있다.
         * 남은 키가 없어질 때까지 다시 요청한다.
         */
        while (!requestItems.isEmpty()) {

            BatchGetItemRequest request =
                    BatchGetItemRequest.builder()
                            .requestItems(requestItems)
                            .build();

            BatchGetItemResponse response =
                    dynamoDbClient.batchGetItem(request);

            List<Map<String, AttributeValue>> items =
                    response.responses()
                            .getOrDefault(
                                    TABLE_NAME,
                                    List.of()
                            );

            for (Map<String, AttributeValue> item : items) {

                AttributeValue pkValue =
                        item.get("pk");

                if (pkValue == null ||
                    pkValue.s() == null) {
                    continue;
                }

                LocalDate date =
                        extractDateFromUsagePk(
                                pkValue.s()
                        );

                result.put(
                        date,
                        toDailyUsage(
                                date,
                                item
                        )
                );
            }

            Map<String, KeysAndAttributes> unprocessed =
                    response.unprocessedKeys();

            if (unprocessed == null ||
                unprocessed.isEmpty()) {

                break;
            }

            requestItems = unprocessed;
        }
    }

    private LocalDate extractDateFromUsagePk(
            String pk
    ) {
        if (!pk.startsWith("USAGE#")) {
            throw new IllegalStateException(
                    "올바르지 않은 USAGE PK입니다: " + pk
            );
        }

        String dateText =
                pk.substring(
                        "USAGE#".length()
                );

        return LocalDate.parse(
                dateText,
                DAY_FORMATTER
        );
    }

    private DailyUsage toDailyUsage(
            LocalDate date,
            Map<String, AttributeValue> item
    ) {
        return new DailyUsage(
                date,

                getLong(
                        item,
                        "analysisCount"
                ),

                getLong(
                        item,
                        "aiSuccessCount"
                ),

                getLong(
                        item,
                        "aiFailureCount"
                ),

                getLong(
                        item,
                        "aiBlockedCount"
                ),

                getLong(
                        item,
                        "inputTokens"
                ),

                getLong(
                        item,
                        "cachedInputTokens"
                ),

                getLong(
                        item,
                        "outputTokens"
                ),

                getBigDecimal(
                        item,
                        "aiCostUsd"
                )
        );
    }

    private DailyUsage createEmptyDailyUsage(
            LocalDate date
    ) {
        return new DailyUsage(
                date,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                BigDecimal.ZERO
        );
    }

    private void incrementCounter(
            String counterName
    ) {
        LocalDate today =
                LocalDate.now(KOREA_ZONE);

        String pk =
                "USAGE#" + DAY_FORMATTER.format(today);

        String updatedAt =
                ZonedDateTime.now(KOREA_ZONE)
                        .format(DATE_TIME_FORMATTER);

        UpdateItemRequest request =
                UpdateItemRequest.builder()
                        .tableName(TABLE_NAME)
                        .key(Map.of(
                                "pk",
                                AttributeValue.builder()
                                        .s(pk)
                                        .build(),

                                "sk",
                                AttributeValue.builder()
                                        .s("SUMMARY")
                                        .build()
                        ))
                        .updateExpression(
                                "SET #counter = if_not_exists(#counter, :zero) + :one, " +
                                "#updatedAt = :updatedAt"
                        )
                        .expressionAttributeNames(Map.of(
                                "#counter",
                                counterName,

                                "#updatedAt",
                                "updatedAt"
                        ))
                        .expressionAttributeValues(Map.of(
                                ":zero",
                                AttributeValue.builder()
                                        .n("0")
                                        .build(),

                                ":one",
                                AttributeValue.builder()
                                        .n("1")
                                        .build(),

                                ":updatedAt",
                                AttributeValue.builder()
                                        .s(updatedAt)
                                        .build()
                        ))
                        .build();

        dynamoDbClient.updateItem(request);
    }

    private long getLong(
            Map<String, AttributeValue> item,
            String attributeName
    ) {
        AttributeValue value =
                item.get(attributeName);

        if (value == null ||
            value.n() == null) {

            return 0;
        }

        return Long.parseLong(
                value.n()
        );
    }

    private BigDecimal getBigDecimal(
            Map<String, AttributeValue> item,
            String attributeName
    ) {
        AttributeValue value =
                item.get(attributeName);

        if (value == null ||
            value.n() == null) {

            return BigDecimal.ZERO;
        }

        return new BigDecimal(
                value.n()
        );
    }

    public record DailyUsage(
            LocalDate date,
            long analysisCount,
            long aiSuccessCount,
            long aiFailureCount,
            long aiBlockedCount,
            long inputTokens,
            long cachedInputTokens,
            long outputTokens,
            BigDecimal aiCostUsd
    ) {
    }
}