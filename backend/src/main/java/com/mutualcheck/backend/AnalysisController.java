package com.mutualcheck.backend;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
public class AnalysisController {

    private static final long TWITTER_SNOWFLAKE_EPOCH = 1288834974657L;
    private static final long MIN_SNOWFLAKE_ID = 1L << 22;
    private static final long MAX_RELATION_FILE_SIZE = 50L * 1024 * 1024;
    private static final ZoneId KOREA_ZONE = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy.MM.dd");

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final AdminStatsRepository adminStatsRepository;
    private final AdminErrorLogRepository adminErrorLogRepository;

    public AnalysisController(
            AdminStatsRepository adminStatsRepository,
            AdminErrorLogRepository adminErrorLogRepository
    ) {
        this.adminStatsRepository = adminStatsRepository;
        this.adminErrorLogRepository = adminErrorLogRepository;
    }

    @PostMapping("/api/analysis/upload")
    public Map<String, Object> uploadAnalysisFiles(
            @RequestParam("followersFile") MultipartFile followersFile,
            @RequestParam("followingFile") MultipartFile followingFile
    ) throws IOException {

        try {
            String followersContent = readRelationFile(followersFile);
            String followingContent = readRelationFile(followingFile);

            validateRelationFile(
                    followersFile,
                    followersContent,
                    "follower"
            );

            validateRelationFile(
                    followingFile,
                    followingContent,
                    "following"
            );

            List<Map<String, String>> followerAccounts =
                    extractAccounts(
                            followersContent,
                            "follower"
                    );

            List<Map<String, String>> followingAccounts =
                    extractAccounts(
                            followingContent,
                            "following"
                    );

            Set<String> followerIds =
                    extractIds(followerAccounts);

            Set<String> followingIds =
                    extractIds(followingAccounts);

            List<Map<String, String>> mutualAccounts =
                    new ArrayList<Map<String, String>>();

            List<Map<String, String>> nonMutualAccounts =
                    new ArrayList<Map<String, String>>();

            for (Map<String, String> followingAccount
                    : followingAccounts) {

                String accountId =
                        followingAccount.get("accountId");

                if (accountId == null
                        || accountId.isBlank()) {
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
                mutualRate =
                        Math.round(
                                ((double) mutualAccounts.size()
                                        / followingIds.size())
                                        * 1000.0
                        ) / 10.0;
            }

            Map<String, Object> result =
                    new LinkedHashMap<String, Object>();

            result.put("status", "ok");
            result.put("message", "분석 성공");
            result.put(
                    "followersCount",
                    followerIds.size()
            );
            result.put(
                    "followingCount",
                    followingIds.size()
            );
            result.put(
                    "mutualCount",
                    mutualAccounts.size()
            );
            result.put(
                    "nonMutualCount",
                    nonMutualAccounts.size()
            );
            result.put(
                    "mutualRate",
                    mutualRate
            );
            result.put(
                    "mutualAccounts",
                    mutualAccounts
            );
            result.put(
                    "nonMutualAccounts",
                    nonMutualAccounts
            );
            result.put(
                    "ageGroups",
                    buildAgeGroups(
                            mutualAccounts,
                            nonMutualAccounts
                    )
            );
            result.put(
                    "nonMutualYearStats",
                    buildNonMutualYearStats(
                            nonMutualAccounts
                    )
            );

            try {
                adminStatsRepository
                        .incrementAnalysisCount();

            } catch (Exception statsException) {
                System.err.println(
                        "분석 성공 통계 저장 실패: "
                                + statsException.getMessage()
                );
            }

            return result;

        } catch (ResponseStatusException e) {

            /*
            * 잘못된 파일명, 잘못된 X 데이터 파일,
            * 빈 파일, 용량 초과 등 사용자 입력 오류.
            *
            * 관리자 최근 오류에는 기록하지 않는다.
            */
            throw e;

        } catch (Exception e) {

            /*
            * 정상적인 사용자 입력 오류가 아닌
            * 예상하지 못한 서버 분석 오류만 기록한다.
            */
            try {
                adminErrorLogRepository.saveError(
                        AdminErrorLogRepository.ErrorType.ANALYSIS,
                        "파일 분석 중 오류가 발생했습니다."
                );

            } catch (Exception logException) {
                System.err.println(
                        "분석 오류 로그 저장 실패: "
                                + logException.getMessage()
                );
            }

            throw e;
        }
    }

    private String readRelationFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw badRequest("비어 있는 파일은 업로드할 수 없습니다.");
        }

        if (file.getSize() > MAX_RELATION_FILE_SIZE) {
            throw badRequest("파일 크기가 너무 큽니다.");
        }

        return new String(file.getBytes(), StandardCharsets.UTF_8);
    }

    private void validateRelationFile(
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

    private List<Map<String, String>> extractAccounts(String content, String relationKey) {
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

    private List<Map<String, Object>> buildAgeGroups(
            List<Map<String, String>> mutualAccounts,
            List<Map<String, String>> nonMutualAccounts
    ) {
        List<String> groupOrder = List.of(
                "1개월 미만",
                "1~5개월",
                "6~11개월",
                "1~3년",
                "4~6년",
                "7년 이상"
        );

        Map<String, List<Map<String, String>>> groupedMutualAccounts =
                new LinkedHashMap<String, List<Map<String, String>>>();
        Map<String, List<Map<String, String>>> groupedNonMutualAccounts =
                new LinkedHashMap<String, List<Map<String, String>>>();

        for (String groupLabel : groupOrder) {
            groupedMutualAccounts.put(groupLabel, new ArrayList<Map<String, String>>());
            groupedNonMutualAccounts.put(groupLabel, new ArrayList<Map<String, String>>());
        }

        groupAccountsByAge(mutualAccounts, groupedMutualAccounts);
        groupAccountsByAge(nonMutualAccounts, groupedNonMutualAccounts);

        List<Map<String, Object>> ageGroups = new ArrayList<Map<String, Object>>();

        for (String groupLabel : groupOrder) {
            List<Map<String, String>> mutualGroup = groupedMutualAccounts.get(groupLabel);
            List<Map<String, String>> nonMutualGroup = groupedNonMutualAccounts.get(groupLabel);

            int mutualCount = mutualGroup.size();
            int nonMutualCount = nonMutualGroup.size();

            Map<String, Object> group = new LinkedHashMap<String, Object>();
            group.put("label", groupLabel);
            group.put("totalCount", mutualCount + nonMutualCount);
            group.put("mutualCount", mutualCount);
            group.put("nonMutualCount", nonMutualCount);
            group.put("yearStats", buildYearStats(mutualGroup, nonMutualGroup));

            ageGroups.add(group);
        }

        return ageGroups;
    }

    private void groupAccountsByAge(
            List<Map<String, String>> accounts,
            Map<String, List<Map<String, String>>> groupedAccounts
    ) {
        for (Map<String, String> account : accounts) {
            String ageGroup = account.get("accountAgeGroup");

            if (ageGroup == null || ageGroup.isBlank() || !groupedAccounts.containsKey(ageGroup)) {
                ageGroup = "7년 이상";
            }

            groupedAccounts.get(ageGroup).add(account);
        }
    }

    private List<Map<String, Object>> buildNonMutualYearStats(List<Map<String, String>> nonMutualAccounts) {
        Map<String, Integer> yearlyCountMap = new LinkedHashMap<String, Integer>();

        for (Map<String, String> account : nonMutualAccounts) {
            String yearKey = extractYearKey(account.get("accountCreatedDate"));

            if (!yearlyCountMap.containsKey(yearKey)) {
                yearlyCountMap.put(yearKey, 0);
            }

            yearlyCountMap.put(yearKey, yearlyCountMap.get(yearKey) + 1);
        }

        List<Map.Entry<String, Integer>> sortedEntries = new ArrayList<Map.Entry<String, Integer>>(yearlyCountMap.entrySet());

        sortedEntries.sort(
                Comparator.<Map.Entry<String, Integer>>comparingInt(Map.Entry::getValue)
                        .reversed()
                        .thenComparing(Map.Entry::getKey)
        );

        List<Map<String, Object>> yearStats = new ArrayList<Map<String, Object>>();

        int totalNonMutualCount = nonMutualAccounts.size();
        int coverageCount = 0;

        for (Map.Entry<String, Integer> entry : sortedEntries) {
            String year = entry.getKey();
            int count = entry.getValue();

            coverageCount += count;

            double coverageRate = 0.0;

            if (totalNonMutualCount > 0) {
                coverageRate = Math.round(((double) coverageCount / totalNonMutualCount) * 1000.0) / 10.0;
            }

            Map<String, Object> yearStat = new LinkedHashMap<String, Object>();
            yearStat.put("year", year);
            yearStat.put("totalCount", count);
            yearStat.put("coverageCount", coverageCount);
            yearStat.put("coverageRate", coverageRate);
            yearStat.put("coverageRateText", formatPercent(coverageRate));

            yearStats.add(yearStat);
        }

        return yearStats;
    }

    private List<Map<String, Object>> buildYearStats(
            List<Map<String, String>> mutualAccounts,
            List<Map<String, String>> nonMutualAccounts
    ) {
        Map<String, int[]> yearlyMap = new TreeMap<String, int[]>();

        for (Map<String, String> account : mutualAccounts) {
            String yearKey = extractYearKey(account.get("accountCreatedDate"));
            int[] counts = yearlyMap.computeIfAbsent(yearKey, key -> new int[2]);
            counts[0]++;
        }

        for (Map<String, String> account : nonMutualAccounts) {
            String yearKey = extractYearKey(account.get("accountCreatedDate"));
            int[] counts = yearlyMap.computeIfAbsent(yearKey, key -> new int[2]);
            counts[1]++;
        }

        List<Map<String, Object>> yearStats = new ArrayList<Map<String, Object>>();

        for (Map.Entry<String, int[]> entry : yearlyMap.entrySet()) {
            String year = entry.getKey();
            int mutualCount = entry.getValue()[0];
            int nonMutualCount = entry.getValue()[1];
            int totalCount = mutualCount + nonMutualCount;

            double nonMutualRate = 0.0;

            if (totalCount > 0) {
                nonMutualRate = Math.round(((double) nonMutualCount / totalCount) * 1000.0) / 10.0;
            }

            Map<String, Object> yearStat = new LinkedHashMap<String, Object>();
            yearStat.put("year", year);
            yearStat.put("totalCount", totalCount);
            yearStat.put("mutualCount", mutualCount);
            yearStat.put("nonMutualCount", nonMutualCount);
            yearStat.put("nonMutualRate", nonMutualRate);
            yearStat.put("nonMutualRateText", formatPercent(nonMutualRate));

            yearStats.add(yearStat);
        }

        return yearStats;
    }

    private String extractYearKey(String accountCreatedDate) {
        if (accountCreatedDate == null || accountCreatedDate.isBlank()) {
            return "2010년 이전";
        }

        if (accountCreatedDate.contains("2010년 이전")) {
            return "2010년 이전";
        }

        if (accountCreatedDate.length() >= 4) {
            return accountCreatedDate.substring(0, 4);
        }

        return "2010년 이전";
    }

    private String formatPercent(double rate) {
        if (rate == Math.floor(rate)) {
            return String.valueOf((int) rate) + "%";
        }

        return String.format("%.1f%%", rate);
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