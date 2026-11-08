// 파일 읽기·검증·파싱
package com.mutualcheck.backend.analysis;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class TwitterArchiveParser {

    private static final long TWITTER_SNOWFLAKE_EPOCH = 1288834974657L;
    private static final long MIN_SNOWFLAKE_ID = 1L << 22;
    private static final long MAX_RELATION_FILE_SIZE = 50L * 1024 * 1024;
    private static final ZoneId KOREA_ZONE = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy.MM.dd");

    private final ObjectMapper objectMapper = new ObjectMapper();

    public String readRelationFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw badRequest("비어 있는 파일은 업로드할 수 없습니다.");
        }

        if (file.getSize() > MAX_RELATION_FILE_SIZE) {
            throw badRequest("파일 크기가 너무 큽니다.");
        }

        return new String(file.getBytes(), StandardCharsets.UTF_8);
    }

    public void validateRelationFile(
            MultipartFile file,
            String content,
            String relationKey
    ) {
        String originalFilename = file.getOriginalFilename();

        if (originalFilename == null || originalFilename.isBlank()) {
            throw badRequest("파일명을 확인할 수 없습니다.");
        }

        String normalizedFilename = originalFilename.trim().toLowerCase();

        if ("following".equals(relationKey)) {
            if (!"following.js".equals(normalizedFilename)) {
                throw badRequest("following.js 파일을 선택해주세요.");
            }
        } else if ("follower".equals(relationKey)) {
            if (!"followers.js".equals(normalizedFilename) && !"follower.js".equals(normalizedFilename)) {
                throw badRequest("followers.js 파일을 선택해주세요.");
            }
        } else {
            throw badRequest("지원하지 않는 파일 형식입니다.");
        }

        if (content.isBlank()) {
            throw badRequest("비어 있는 파일은 업로드할 수 없습니다.");
        }

        String expectedWrapper = "following".equals(relationKey)
                ? "window.YTD.following.part"
                : "window.YTD.follower.part";

        if (!containsArchiveWrapper(content, expectedWrapper)) {
            throw badRequest(
                    "지원하지 않는 파일 형식입니다. X 데이터 보관 파일 형식이 변경되었을 수 있습니다."
            );
        }
    }

    private boolean containsArchiveWrapper(String content, String expectedWrapper) {
        int wrapperIndex = content.indexOf(expectedWrapper);

        if (wrapperIndex < 0) {
            return false;
        }

        int equalsIndex = content.indexOf("=", wrapperIndex + expectedWrapper.length());

        if (equalsIndex < 0) {
            return false;
        }

        String partText = content.substring(
                wrapperIndex + expectedWrapper.length(),
                equalsIndex
        ).trim();

        if (partText.isEmpty()) {
            return false;
        }

        for (int i = 0; i < partText.length(); i++) {
            if (!Character.isDigit(partText.charAt(i))) {
                return false;
            }
        }

        return true;
    }

    public List<Map<String, String>> extractAccounts(String content, String relationKey) {
        String jsonArrayText = extractJsonArrayText(content);

        final List<Map<String, Object>> rows;

        try {
            rows = objectMapper.readValue(
                    jsonArrayText,
                    new TypeReference<List<Map<String, Object>>>() {
                    }
            );
        } catch (IOException e) {
            throw badRequest("파일 내용을 확인할 수 없습니다. 올바른 X 데이터 보관 파일인지 확인해주세요.");
        }

        List<Map<String, String>> accounts = new ArrayList<Map<String, String>>();

        for (int i = 0; i < rows.size(); i++) {
            Map<String, Object> row = rows.get(i);
            Object relationObject = row.get(relationKey);

            if (!(relationObject instanceof Map<?, ?> relationMap)) {
                throw badRequest("파일 내용을 확인할 수 없습니다. 올바른 X 데이터 보관 파일인지 확인해주세요.");
            }

            Object accountIdObject = relationMap.get("accountId");
            Object userLinkObject = relationMap.get("userLink");

            if (!(accountIdObject instanceof String accountId) || accountId.isBlank()) {
                throw badRequest("파일 내용을 확인할 수 없습니다. 올바른 X 데이터 보관 파일인지 확인해주세요.");
            }

            accountId = accountId.trim();

            if (!isNumericAccountId(accountId)) {
                throw badRequest("파일 내용을 확인할 수 없습니다. 올바른 X 데이터 보관 파일인지 확인해주세요.");
            }

            String userLink = "https://twitter.com/intent/user?user_id=" + accountId;

            if (userLinkObject != null) {
                if (!(userLinkObject instanceof String userLinkText) || userLinkText.isBlank()) {
                    throw badRequest("파일 내용을 확인할 수 없습니다. 올바른 X 데이터 보관 파일인지 확인해주세요.");
                }

                userLink = userLinkText;
            }

            Map<String, String> account = new LinkedHashMap<String, String>();
            account.put("accountId", accountId);
            account.put("userLink", userLink);

            if (isSnowflakeAccountId(accountId)) {
                LocalDate accountCreatedDate = calculateAccountCreatedDate(accountId);
                String accountCreatedDateText = accountCreatedDate.format(DATE_FORMATTER);
                String accountAgeText = calculateAccountAgeText(accountCreatedDate);
                String accountAgeGroup = calculateAccountAgeGroup(accountCreatedDate);

                account.put("accountCreatedDate", accountCreatedDateText);
                account.put("accountAge", accountAgeText);
                account.put("accountAgeGroup", accountAgeGroup);
                account.put("isLegacyAccount", "false");
            } else {
                account.put("accountCreatedDate", "2010년 이전 추정");
                account.put("accountAge", "확인 필요");
                account.put("accountAgeGroup", "7년 이상");
                account.put("isLegacyAccount", "true");
            }

            accounts.add(account);
        }

        return accounts;
    }

    private boolean isNumericAccountId(String accountId) {
        for (int i = 0; i < accountId.length(); i++) {
            if (!Character.isDigit(accountId.charAt(i))) {
                return false;
            }
        }

        return !accountId.isEmpty();
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private boolean isSnowflakeAccountId(String accountId) {
        try {
            long snowflakeId = Long.parseLong(accountId);
            return snowflakeId >= MIN_SNOWFLAKE_ID;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private LocalDate calculateAccountCreatedDate(String accountId) {
        long snowflakeId = Long.parseLong(accountId);
        long timestampMillis = (snowflakeId >> 22) + TWITTER_SNOWFLAKE_EPOCH;

        return Instant.ofEpochMilli(timestampMillis)
                .atZone(KOREA_ZONE)
                .toLocalDate();
    }

    private String calculateAccountAgeText(LocalDate accountCreatedDate) {
        LocalDate today = LocalDate.now(KOREA_ZONE);

        int totalMonths =
                (today.getYear() - accountCreatedDate.getYear()) * 12
                        + (today.getMonthValue() - accountCreatedDate.getMonthValue());

        totalMonths = Math.max(totalMonths, 0);

        if (totalMonths < 1) {
            return "1개월 미만";
        }

        int years = totalMonths / 12;
        int months = totalMonths % 12;

        if (years <= 0) {
            return months + "개월";
        }

        if (months <= 0) {
            return years + "년";
        }

        return years + "년 " + months + "개월";
    }

    private String calculateAccountAgeGroup(LocalDate accountCreatedDate) {
        LocalDate today = LocalDate.now(KOREA_ZONE);

        int totalMonths =
                (today.getYear() - accountCreatedDate.getYear()) * 12
                        + (today.getMonthValue() - accountCreatedDate.getMonthValue());

        totalMonths = Math.max(totalMonths, 0);

        if (totalMonths < 1) {
            return "1개월 미만";
        }

        if (totalMonths < 6) {
            return "1~5개월";
        }

        if (totalMonths < 12) {
            return "6~11개월";
        }

        if (totalMonths < 48) {
            return "1~3년";
        }

        if (totalMonths < 84) {
            return "4~6년";
        }

        return "7년 이상";
    }

    private String extractJsonArrayText(String content) {
        int startIndex = content.indexOf("[");
        int endIndex = content.lastIndexOf("]");

        if (startIndex == -1 || endIndex == -1 || startIndex >= endIndex) {
            throw badRequest("파일 내용을 확인할 수 없습니다. 올바른 X 데이터 보관 파일인지 확인해주세요.");
        }

        return content.substring(startIndex, endIndex + 1);
    }

}
