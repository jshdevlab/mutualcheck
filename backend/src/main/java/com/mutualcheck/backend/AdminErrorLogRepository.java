package com.mutualcheck.backend;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Repository;

import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.dynamodb.model.QueryRequest;
import software.amazon.awssdk.services.dynamodb.model.QueryResponse;

@Repository
public class AdminErrorLogRepository {

    private static final String TABLE_NAME = "mutualcheck-admin";

    private static final String ERROR_PK = "ERROR";

    private static final ZoneId KOREA_ZONE =
            ZoneId.of("Asia/Seoul");

    private static final DateTimeFormatter DISPLAY_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private static final DateTimeFormatter SORT_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSSXXX");

    private static final int ERROR_RETENTION_DAYS = 30;

    private static final int RECENT_ERROR_LIMIT = 5;

    private final DynamoDbClient dynamoDbClient;

    public AdminErrorLogRepository(
            DynamoDbClient dynamoDbClient
    ) {
        this.dynamoDbClient = dynamoDbClient;
    }

    public void saveError(
            ErrorType type,
            String message
    ) {
        ZonedDateTime now =
                ZonedDateTime.now(KOREA_ZONE);

        String occurredAt =
                now.format(DISPLAY_TIME_FORMATTER);

        String sortKey =
                now.format(SORT_TIME_FORMATTER)
                        + "#"
                        + UUID.randomUUID();

        long ttl =
                Instant.now()
                        .plus(
                                ERROR_RETENTION_DAYS,
                                ChronoUnit.DAYS
                        )
                        .getEpochSecond();

        String safeMessage =
                sanitizeMessage(message);

        PutItemRequest request =
                PutItemRequest.builder()
                        .tableName(TABLE_NAME)
                        .item(Map.of(
                                "pk",
                                AttributeValue.builder()
                                        .s(ERROR_PK)
                                        .build(),

                                "sk",
                                AttributeValue.builder()
                                        .s(sortKey)
                                        .build(),

                                "type",
                                AttributeValue.builder()
                                        .s(type.name())
                                        .build(),

                                "occurredAt",
                                AttributeValue.builder()
                                        .s(occurredAt)
                                        .build(),

                                "message",
                                AttributeValue.builder()
                                        .s(safeMessage)
                                        .build(),

                                "ttl",
                                AttributeValue.builder()
                                        .n(String.valueOf(ttl))
                                        .build()
                        ))
                        .build();

        dynamoDbClient.putItem(request);
    }

    public List<ErrorLog> getRecentErrors() {

        QueryRequest request =
                QueryRequest.builder()
                        .tableName(TABLE_NAME)
                        .keyConditionExpression(
                                "#pk = :pk"
                        )
                        .expressionAttributeNames(
                                Map.of(
                                        "#pk",
                                        "pk"
                                )
                        )
                        .expressionAttributeValues(
                                Map.of(
                                        ":pk",
                                        AttributeValue.builder()
                                                .s(ERROR_PK)
                                                .build()
                                )
                        )
                        .scanIndexForward(false)
                        .limit(RECENT_ERROR_LIMIT)
                        .consistentRead(true)
                        .build();

        QueryResponse response =
                dynamoDbClient.query(request);

        List<ErrorLog> errors =
                new ArrayList<>();

        for (Map<String, AttributeValue> item
                : response.items()) {

            String occurredAt =
                    getString(
                            item,
                            "occurredAt"
                    );

            String type =
                    getString(
                            item,
                            "type"
                    );

            String message =
                    getString(
                            item,
                            "message"
                    );

            errors.add(
                    new ErrorLog(
                            occurredAt,
                            type,
                            message
                    )
            );
        }

        return errors;
    }

    private String sanitizeMessage(
            String message
    ) {
        if (message == null ||
            message.isBlank()) {

            return "알 수 없는 오류가 발생했습니다.";
        }

        String sanitized =
                message
                        .replace("\r", " ")
                        .replace("\n", " ")
                        .replace("\t", " ")
                        .trim();

        int maxLength = 500;

        if (sanitized.length() > maxLength) {
            return sanitized.substring(
                    0,
                    maxLength
            );
        }

        return sanitized;
    }

    private String getString(
            Map<String, AttributeValue> item,
            String attributeName
    ) {
        AttributeValue value =
                item.get(attributeName);

        if (value == null ||
            value.s() == null) {

            return "";
        }

        return value.s();
    }

    public enum ErrorType {
        ANALYSIS,
        AI
    }

    public record ErrorLog(
            String occurredAt,
            String type,
            String message
    ) {
    }
}