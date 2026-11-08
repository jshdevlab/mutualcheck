// 맞팔 계산 / 통계 / 오류 처리
package com.mutualcheck.backend.analysis;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.mutualcheck.backend.admin.AdminErrorLogRepository;
import com.mutualcheck.backend.admin.AdminStatsRepository;
import com.mutualcheck.backend.analysis.dto.AnalysisResult;

@Service
public class AnalysisService {

    private final TwitterArchiveParser twitterArchiveParser;
    private final AdminStatsRepository adminStatsRepository;
    private final AdminErrorLogRepository adminErrorLogRepository;

    public AnalysisService(
            TwitterArchiveParser twitterArchiveParser,
            AdminStatsRepository adminStatsRepository,
            AdminErrorLogRepository adminErrorLogRepository
    ) {
        this.twitterArchiveParser = twitterArchiveParser;
        this.adminStatsRepository = adminStatsRepository;
        this.adminErrorLogRepository = adminErrorLogRepository;
    }

    public AnalysisResult analyze(
            MultipartFile followersFile,
            MultipartFile followingFile
    ) throws IOException {

        try {
            String followersContent = twitterArchiveParser.readRelationFile(followersFile);
            String followingContent = twitterArchiveParser.readRelationFile(followingFile);

            twitterArchiveParser.validateRelationFile(
                    followersFile,
                    followersContent,
                    "follower"
            );

            twitterArchiveParser.validateRelationFile(
                    followingFile,
                    followingContent,
                    "following"
            );

            List<Map<String, String>> followerAccounts =
                    twitterArchiveParser.extractAccounts(followersContent, "follower");

            List<Map<String, String>> followingAccounts =
                    twitterArchiveParser.extractAccounts(followingContent, "following");

            Set<String> followerIds = extractIds(followerAccounts);
            Set<String> followingIds = extractIds(followingAccounts);

            List<Map<String, String>> mutualAccounts = new ArrayList<>();
            List<Map<String, String>> nonMutualAccounts = new ArrayList<>();

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
                mutualRate = Math.round(
                        ((double) mutualAccounts.size() / followingIds.size()) * 1000.0
                ) / 10.0;
            }

            AnalysisResult result = new AnalysisResult(
                    "ok",
                    "분석 성공",
                    followerIds.size(),
                    followingIds.size(),
                    mutualAccounts.size(),
                    nonMutualAccounts.size(),
                    mutualRate,
                    mutualAccounts,
                    nonMutualAccounts,
                    buildAgeGroups(mutualAccounts, nonMutualAccounts),
                    buildNonMutualYearStats(nonMutualAccounts)
            );

            try {
                adminStatsRepository.incrementAnalysisCount();
            } catch (Exception statsException) {
                System.err.println(
                        "분석 성공 통계 저장 실패: " + statsException.getMessage()
                );
            }

            return result;

        } catch (ResponseStatusException e) {
            // 파일 검증 오류는 관리자 오류 로그에 기록하지 않는다.
            throw e;

        } catch (Exception e) {
            // 예상하지 못한 분석 오류만 관리자 오류 로그에 기록한다.
            try {
                adminErrorLogRepository.saveError(
                        AdminErrorLogRepository.ErrorType.ANALYSIS,
                        "파일 분석 중 오류가 발생했습니다."
                );
            } catch (Exception logException) {
                System.err.println(
                        "분석 오류 로그 저장 실패: " + logException.getMessage()
                );
            }

            throw e;
        }
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

}
