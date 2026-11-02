package com.mutualcheck.backend;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.DescribeTableRequest;
import software.amazon.awssdk.services.dynamodb.model.DescribeTableResponse;

@RestController
public class DynamoDbTestController {

    private static final String TABLE_NAME = "mutualcheck-admin";

    private final DynamoDbClient dynamoDbClient;

    public DynamoDbTestController(DynamoDbClient dynamoDbClient) {
        this.dynamoDbClient = dynamoDbClient;
    }

    @GetMapping("/api/test/dynamodb")
    public Map<String, Object> testDynamoDbConnection() {

        DescribeTableResponse response = dynamoDbClient.describeTable(
                DescribeTableRequest.builder()
                        .tableName(TABLE_NAME)
                        .build()
        );

        return Map.of(
                "status", "OK",
                "tableName", response.table().tableName(),
                "tableStatus", response.table().tableStatusAsString(),
                "itemCount", response.table().itemCount()
        );
    }
}