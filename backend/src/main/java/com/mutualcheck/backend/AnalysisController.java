package com.mutualcheck.backend;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.Period;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
public class AnalysisController {

    private static final long TWITTER_SNOWFLAKE_EPOCH = 1288834974657L;
    private static final long MIN_SNOWFLAKE_ID = 1L << 22;
    private static final ZoneId KOREA_ZONE = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy.MM.dd");

    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping("/api/analysis/upload")
    public Map<String, Object> uploadAnalysisFiles(
            @RequestParam("followersFile") MultipartFile followersFile,
            @RequestParam("followingFile") MultipartFile followingFile
    ) throws IOException {
        List<Map<String, String>> followerAccounts = extractAccounts(followersFile, "follower");
        List<Map<String, String>> followingAccounts = extractAccounts(followingFile, "following");

        Set<String> followerIds = extractIds(followerAccounts);
        Set<String> followingIds = extractIds(followingAccounts);

        List<Map<String, String>> mutualAccounts = new ArrayList<Map<String, String>>();
        List<Map<String, String>> nonMutualAccounts = new ArrayList<Map<String, String>>();

        for (Map<String, String> followingAccount : followingAccounts) {
            String accountId = followingAccount.get("accountId");

            if (accountId == null || accountId.isBlank()) {
                continue;
            }

            if (followerIds.contains(accountId)) {
                mutualAccounts.add(followingAccount);
            } else {
                nonMutualAccounts.add(followingAccount);
            }
        }

        double mutualRate = 0.0;

        if (!followingIds.isEmpty()) {
            mutualRate = Math.round(((double) mutualAccounts.size() / followingIds.size()) * 1000.0) / 10.0;
        }

        Map<String, Object> result = new LinkedHashMap<String, Object>();
        result.put("status", "ok");
        result.put("message", "분석 성공");
        result.put("followersCount", followerIds.size());
        result.put("followingCount", followingIds.size());
        result.put("mutualCount", mutualAccounts.size());
        result.put("nonMutualCount", nonMutualAccounts.size());
        result.put("mutualRate", mutualRate);
        result.put("mutualAccounts", mutualAccounts);
        result.put("nonMutualAccounts", nonMutualAccounts);
        result.put("ageGroups", buildAgeGroups(mutualAccounts, nonMutualAccounts));

        return result;
    }

    private List<Map<String, String>> extractAccounts(MultipartFile file, String relationKey) throws IOException {
        String content = new String(file.getBytes(), StandardCharsets.UTF_8);
        String jsonArrayText = extractJsonArrayText(content);

        List<Map<String, Object>> rows = objectMapper.readValue(
                jsonArrayText,
                new TypeReference<List<Map<String, Object>>>() {
                }
        );

        List<Map<String, String>> accounts = new ArrayList<Map<String, String>>();

        for (Map<String, Object> row : rows) {
            Object relationObject = row.get(relationKey);

            if (!(relationObject instanceof Map)) {
                continue;
            }

            Map<?, ?> relationMap = (Map<?, ?>) relationObject;
            Object accountIdObject = relationMap.get("accountId");
            Object userLinkObject = relationMap.get("userLink");

            if (!(accountIdObject instanceof String)) {
                continue;
            }

            String accountId = (String) accountIdObject;

            if (accountId.isBlank()) {
                continue;
            }

            String userLink = "https://twitter.com/intent/user?user_id=" + accountId;

            if (userLinkObject instanceof String && !((String) userLinkObject).isBlank()) {
                userLink = (String) userLinkObject;
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

    private List<Map<String, Object>> buildAgeGroups(
            List<Map<String, String>> mutualAccounts,
            List<Map<String, String>> nonMutualAccounts
    ) {
        List<Map<String, String>> allAccounts = new ArrayList<Map<String, String>>();

        for (Map<String, String> account : mutualAccounts) {
            Map<String, String> copiedAccount = new LinkedHashMap<String, String>(account);
            copiedAccount.put("relation", "mutual");
            allAccounts.add(copiedAccount);
        }

        for (Map<String, String> account : nonMutualAccounts) {
            Map<String, String> copiedAccount = new LinkedHashMap<String, String>(account);
            copiedAccount.put("relation", "nonMutual");
            allAccounts.add(copiedAccount);
        }

        List<String> groupOrder = List.of(
                "1년 미만",
                "1년 이상",
                "3년 이상",
                "5년 이상",
                "7년 이상"
        );

        Map<String, List<Map<String, String>>> groupedAccounts = new LinkedHashMap<String, List<Map<String, String>>>();

        for (String groupLabel : groupOrder) {
            groupedAccounts.put(groupLabel, new ArrayList<Map<String, String>>());
        }

        for (Map<String, String> account : allAccounts) {
            String ageGroup = account.get("accountAgeGroup");

            if (ageGroup == null || ageGroup.isBlank()) {
                ageGroup = "7년 이상";
            }

            if (!groupedAccounts.containsKey(ageGroup)) {
                groupedAccounts.put(ageGroup, new ArrayList<Map<String, String>>());
            }

            groupedAccounts.get(ageGroup).add(account);
        }

        List<Map<String, Object>> ageGroups = new ArrayList<Map<String, Object>>();

        for (String groupLabel : groupOrder) {
            List<Map<String, String>> accounts = groupedAccounts.get(groupLabel);

            int mutualCount = 0;
            int nonMutualCount = 0;

            for (Map<String, String> account : accounts) {
                if ("mutual".equals(account.get("relation"))) {
                    mutualCount++;
                }

                if ("nonMutual".equals(account.get("relation"))) {
                    nonMutualCount++;
                }
            }

            Map<String, Object> group = new LinkedHashMap<String, Object>();
            group.put("label", groupLabel);
            group.put("totalCount", accounts.size());
            group.put("mutualCount", mutualCount);
            group.put("nonMutualCount", nonMutualCount);
            group.put("monthlyStats", buildMonthlyStats(accounts));

            ageGroups.add(group);
        }

        return ageGroups;
    }

    private List<Map<String, Object>> buildMonthlyStats(List<Map<String, String>> accounts) {
        Map<String, List<Map<String, String>>> monthlyMap = new LinkedHashMap<String, List<Map<String, String>>>();

        for (Map<String, String> account : accounts) {
            String monthKey = extractMonthKey(account.get("accountCreatedDate"));

            if (!monthlyMap.containsKey(monthKey)) {
                monthlyMap.put(monthKey, new ArrayList<Map<String, String>>());
            }

            monthlyMap.get(monthKey).add(account);
        }

        List<Map<String, Object>> monthlyStats = new ArrayList<Map<String, Object>>();

        for (Map.Entry<String, List<Map<String, String>>> entry : monthlyMap.entrySet()) {
            String month = entry.getKey();
            List<Map<String, String>> monthAccounts = entry.getValue();

            int mutualCount = 0;
            int nonMutualCount = 0;

            List<Map<String, String>> visibleAccounts = new ArrayList<Map<String, String>>();

            for (Map<String, String> account : monthAccounts) {
                if ("mutual".equals(account.get("relation"))) {
                    mutualCount++;
                }

                if ("nonMutual".equals(account.get("relation"))) {
                    nonMutualCount++;
                }

                Map<String, String> visibleAccount = new LinkedHashMap<String, String>();
                visibleAccount.put("accountCreatedDate", account.get("accountCreatedDate"));
                visibleAccount.put("accountAge", account.get("accountAge"));
                visibleAccount.put("relation", account.get("relation"));
                visibleAccount.put("userLink", account.get("userLink"));
                visibleAccount.put("isLegacyAccount", account.get("isLegacyAccount"));

                visibleAccounts.add(visibleAccount);
            }

            Map<String, Object> monthlyStat = new LinkedHashMap<String, Object>();
            monthlyStat.put("month", month);
            monthlyStat.put("totalCount", monthAccounts.size());
            monthlyStat.put("mutualCount", mutualCount);
            monthlyStat.put("nonMutualCount", nonMutualCount);
            monthlyStat.put("accounts", visibleAccounts);

            monthlyStats.add(monthlyStat);
        }

        return monthlyStats;
    }

    private String extractMonthKey(String accountCreatedDate) {
        if (accountCreatedDate == null || accountCreatedDate.isBlank()) {
            return "2010년 이전";
        }

        if (accountCreatedDate.contains("2010년 이전")) {
            return "2010년 이전";
        }

        if (accountCreatedDate.length() >= 7) {
            return accountCreatedDate.substring(0, 7);
        }

        return "2010년 이전";
    }

    private Set<String> extractIds(List<Map<String, String>> accounts) {
        Set<String> ids = new HashSet<String>();

        for (Map<String, String> account : accounts) {
            String accountId = account.get("accountId");

            if (accountId != null && !accountId.isBlank()) {
                ids.add(accountId);
            }
        }

        return ids;
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
        Period period = Period.between(accountCreatedDate, today);

        int years = period.getYears();
        int months = period.getMonths();

        if (years <= 0 && months <= 0) {
            return "1개월 미만";
        }

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
        Period period = Period.between(accountCreatedDate, today);

        int years = period.getYears();

        if (years < 1) {
            return "1년 미만";
        }

        if (years < 3) {
            return "1년 이상";
        }

        if (years < 5) {
            return "3년 이상";
        }

        if (years < 7) {
            return "5년 이상";
        }

        return "7년 이상";
    }

    private String extractJsonArrayText(String content) {
        int startIndex = content.indexOf("[");
        int endIndex = content.lastIndexOf("]");

        if (startIndex == -1 || endIndex == -1 || startIndex >= endIndex) {
            throw new IllegalArgumentException("파일에서 JSON 배열을 찾을 수 없습니다.");
        }

        return content.substring(startIndex, endIndex + 1);
    }
}