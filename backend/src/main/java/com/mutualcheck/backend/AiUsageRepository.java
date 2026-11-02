package com.mutualcheck.backend;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
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
import software.amazon.awssdk.services.dynamodb.model.KeysAndAttributes;
import software.amazon.awssdk.services.dynamodb.model.TransactionCanceledException;
import software.amazon.awssdk.services.dynamodb.model.TransactWriteItem;
import software.amazon.awssdk.services.dynamodb.model.TransactWriteItemsRequest;
import software.amazon.awssdk.services.dynamodb.model.Update;

@Repository
public class AiUsageRepository {

    private static final String TABLE_NAME = "mutualcheck-admin";

    private static final ZoneId KOREA_ZONE =
            ZoneId.of("Asia/Seoul");

    private static final DateTimeFormatter DAY_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private static final DateTimeFormatter MONTH_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM");

    private final DynamoDbClient dynamoDbClient;

    public AiUsageRepository(DynamoDbClient dynamoDbClient) {
        this.dynamoDbClient = dynamoDbClient;
    }

    public AcquireResult tryAcquire(
            int dailyLimit,
            int monthlyLimit
    ) {
        LocalDate today =
                LocalDate.now(KOREA_ZONE);

        YearMonth thisMonth =
                YearMonth.now(KOREA_ZONE);

        String dayKey =
                "QUOTA#DAY#" + DAY_FORMATTER.format(today);

        String monthKey =
                "QUOTA#MONTH#" + MONTH_FORMATTER.format(thisMonth);

        String updatedAt =
                java.time.ZonedDateTime.now(KOREA_ZONE)
                        .format(
                                DateTimeFormatter.ofPattern(
                                        "yyyy-MM-dd HH:mm:ss"
                                )
                        );

        Update dailyUpdate =
                createCounterUpdate(
                        dayKey,
                        dailyLimit,
                        updatedAt
                );

        Update monthlyUpdate =
                createCounterUpdate(
                        monthKey,
                        monthlyLimit,
                        updatedAt
                );

        TransactWriteItemsRequest request =
                TransactWriteItemsRequest.builder()
                        .transactItems(
                                TransactWriteItem.builder()
                                        .update(dailyUpdate)
                                        .build(),

                                TransactWriteItem.builder()
                                        .update(monthlyUpdate)
                                        .build()
                        )
                        .build();

        try {
            dynamoDbClient.transactWriteItems(request);

            return AcquireResult.ALLOWED;

        } catch (TransactionCanceledException e) {

            int dailyCount =
                    getCount(dayKey);

            int monthlyCount =
                    getCount(monthKey);

            if (dailyCount >= dailyLimit) {
                return AcquireResult.DAILY_LIMIT_REACHED;
            }

            if (monthlyCount >= monthlyLimit) {
                return AcquireResult.MONTHLY_LIMIT_REACHED;
            }

            throw e;
        }
    }

    public int getDailyCount() {
        LocalDate today =
                LocalDate.now(KOREA_ZONE);

        return getDailyCount(today);
    }

    public int getMonthlyCount() {
        YearMonth thisMonth =
                YearMonth.now(KOREA_ZONE);

        return getMonthlyCount(thisMonth);
    }

    public int getDailyCount(LocalDate date) {

        String dayKey =
                "QUOTA#DAY#" + DAY_FORMATTER.format(date);

        return getCount(dayKey);
    }

    public int getMonthlyCount(YearMonth month) {

        String monthKey =
                "QUOTA#MONTH#" + MONTH_FORMATTER.format(month);

        return getCount(monthKey);
    }

    public Map<LocalDate, Integer> getDailyCounts(
            List<LocalDate> dates
    ) {
        Map<LocalDate, Integer> result =
                new HashMap<>();

        if (dates == null || dates.isEmpty()) {
            return result;
        }

        List<String> keys =
                new ArrayList<>();

        Map<String, LocalDate> dateByPk =
                new HashMap<>();

        for (LocalDate date : dates) {

            String pk =
                    "QUOTA#DAY#" +
                    DAY_FORMATTER.format(date);

            keys.add(pk);
            dateByPk.put(pk, date);
        }

        Map<String, Integer> counts =
                getCounts(keys);

        for (LocalDate date : dates) {
            result.put(
                    date,
                    0
            );
        }

        for (Map.Entry<String, Integer> entry
                : counts.entrySet()) {

            LocalDate date =
                    dateByPk.get(entry.getKey());

            if (date != null) {
                result.put(
                        date,
                        entry.getValue()
                );
            }
        }

        return result;
    }

    public Map<YearMonth, Integer> getMonthlyCounts(
            List<YearMonth> months
    ) {
        Map<YearMonth, Integer> result =
                new HashMap<>();

        if (months == null || months.isEmpty()) {
            return result;
        }

        List<String> keys =
                new ArrayList<>();

        Map<String, YearMonth> monthByPk =
                new HashMap<>();

        for (YearMonth month : months) {

            String pk =
                    "QUOTA#MONTH#" +
                    MONTH_FORMATTER.format(month);

            keys.add(pk);
            monthByPk.put(pk, month);
        }

        Map<String, Integer> counts =
                getCounts(keys);

        for (YearMonth month : months) {
            result.put(
                    month,
                    0
            );
        }

        for (Map.Entry<String, Integer> entry
                : counts.entrySet()) {

            YearMonth month =
                    monthByPk.get(entry.getKey());

            if (month != null) {
                result.put(
                        month,
                        entry.getValue()
                );
            }
        }

        return result;
    }

    private Map<String, Integer> getCounts(
            List<String> pks
    ) {
        Map<String, Integer> result =
                new HashMap<>();

        if (pks == null || pks.isEmpty()) {
            return result;
        }

        /*
         * DynamoDB BatchGetItem은 한 요청당
         * 최대 100개의 키를 조회할 수 있다.
         */
        for (int start = 0;
             start < pks.size();
             start += 100) {

            int end =
                    Math.min(
                            start + 100,
                            pks.size()
                    );

            List<String> batchPks =
                    pks.subList(
                            start,
                            end
                    );

            loadBatch(
                    batchPks,
                    result
            );
        }

        return result;
    }

    private void loadBatch(
            List<String> pks,
            Map<String, Integer> result
    ) {
        List<Map<String, AttributeValue>> keys =
                new ArrayList<>();

        for (String pk : pks) {

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
         * DynamoDB가 한 번에 처리하지 못한 키는
         * unprocessedKeys로 반환될 수 있으므로
         * 남은 키가 없어질 때까지 다시 조회한다.
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

                AttributeValue countValue =
                        item.get("aiCallCount");

                int count = 0;

                if (countValue != null &&
                    countValue.n() != null) {

                    count =
                            Integer.parseInt(
                                    countValue.n()
                            );
                }

                result.put(
                        pkValue.s(),
                        count
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

    private Update createCounterUpdate(
            String pk,
            int limit,
            String updatedAt
    ) {
        return Update.builder()
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
                        "SET #count = if_not_exists(#count, :zero) + :one, " +
                        "#updatedAt = :updatedAt"
                )
                .conditionExpression(
                        "attribute_not_exists(#count) OR #count < :limit"
                )
                .expressionAttributeNames(Map.of(
                        "#count",
                        "aiCallCount",

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

                        ":limit",
                        AttributeValue.builder()
                                .n(String.valueOf(limit))
                                .build(),

                        ":updatedAt",
                        AttributeValue.builder()
                                .s(updatedAt)
                                .build()
                ))
                .build();
    }

    private int getCount(
            String pk
    ) {
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

        Map<String, AttributeValue> item =
                dynamoDbClient.getItem(request)
                        .item();

        if (item == null ||
            item.isEmpty()) {

            return 0;
        }

        AttributeValue count =
                item.get("aiCallCount");

        if (count == null ||
            count.n() == null) {

            return 0;
        }

        return Integer.parseInt(
                count.n()
        );
    }

    public enum AcquireResult {
        ALLOWED,
        DAILY_LIMIT_REACHED,
        MONTHLY_LIMIT_REACHED
    }
}