// 계정 생성 기간별 맞팔/비맞팔 분포 및 상세 통계 계산
import type { AccountItem, PeriodBucket, PeriodDistributionItem, YearDistributionItem } from "../types/dashboard";
import {
  formatAgeByMonths,
  getAccountCreatedPeriodLabel,
  getAgeInMonths,
  getAverageAgeMonths,
  getPeriodSortValue,
  isLegacyAccount,
  parseAccountCreatedDate,
} from "./accountDate";

const PERIOD_BUCKETS: PeriodBucket[] = [
  { key: "under30", label: "1개월 미만", minMonths: 0, maxMonths: 1 },
  { key: "oneToSixMonths", label: "1~5개월", minMonths: 1, maxMonths: 6 },
  { key: "sixToTwelveMonths", label: "6~11개월", minMonths: 6, maxMonths: 12 },
  { key: "oneToThreeYears", label: "1~3년", minMonths: 12, maxMonths: 48 },
  { key: "fourToSixYears", label: "4~6년", minMonths: 48, maxMonths: 84 },
  { key: "overSevenYears", label: "7년 이상", minMonths: 84, maxMonths: null },
];

export function createPeriodDistribution(
  nonMutualAccounts: AccountItem[],
  mutualAccounts: AccountItem[],
): PeriodDistributionItem[] {
  const nonMutualTotal = Math.max(nonMutualAccounts.length, 1);
  const mutualTotal = Math.max(mutualAccounts.length, 1);

  return PERIOD_BUCKETS.map((bucket) => {
    const nonMutualCount = filterAccountsByPeriod(
      nonMutualAccounts,
      bucket,
    ).length;
    const mutualCount = filterAccountsByPeriod(mutualAccounts, bucket).length;

    return {
      ...bucket,
      nonMutualCount,
      mutualCount,
      nonMutualRate: (nonMutualCount / nonMutualTotal) * 100,
      mutualRate: (mutualCount / mutualTotal) * 100,
      totalCount: nonMutualCount + mutualCount,
    };
  });
}

export function filterAccountsByPeriod<T extends AccountItem>(
  accounts: T[],
  bucket: PeriodBucket,
): T[] {
  return accounts.filter((account) => {
    if (isLegacyAccount(account)) {
      return bucket.key === "overSevenYears";
    }

    const createdDate = parseAccountCreatedDate(account.accountCreatedDate);

    if (!createdDate) {
      return false;
    }

    const ageMonths = getAgeInMonths(createdDate);
    const isAfterMin = ageMonths >= bucket.minMonths;
    const isBeforeMax =
      bucket.maxMonths === null ? true : ageMonths < bucket.maxMonths;

    return isAfterMin && isBeforeMax;
  });
}

export function createYearDistribution(
  nonMutualAccounts: AccountItem[],
  mutualAccounts: AccountItem[],
): YearDistributionItem[] {
  const yearMap = new Map<
    string,
    {
      nonMutualCount: number;
      mutualCount: number;
    }
  >();

  nonMutualAccounts.forEach((account) => {
    const year = getAccountCreatedPeriodLabel(account);
    if (!year) return;

    const current = yearMap.get(year) ?? {
      nonMutualCount: 0,
      mutualCount: 0,
    };

    yearMap.set(year, {
      ...current,
      nonMutualCount: current.nonMutualCount + 1,
    });
  });

  mutualAccounts.forEach((account) => {
    const year = getAccountCreatedPeriodLabel(account);
    if (!year) return;

    const current = yearMap.get(year) ?? {
      nonMutualCount: 0,
      mutualCount: 0,
    };

    yearMap.set(year, {
      ...current,
      mutualCount: current.mutualCount + 1,
    });
  });

  return Array.from(yearMap.entries())
    .map(([year, value]) => ({
      year,
      nonMutualCount: value.nonMutualCount,
      mutualCount: value.mutualCount,
      totalCount: value.nonMutualCount + value.mutualCount,
    }))
    .sort((a, b) => getPeriodSortValue(a.year) - getPeriodSortValue(b.year));
}

export function createSelectedPeriodSummary(
  selectedPeriod: PeriodDistributionItem,
  nonMutualAccounts: AccountItem[],
  mutualAccounts: AccountItem[],
  yearDistribution: YearDistributionItem[],
) {
  const allAccounts = [...nonMutualAccounts, ...mutualAccounts];
  const totalCount = allAccounts.length;
  const nonMutualCount = nonMutualAccounts.length;
  const mutualCount = mutualAccounts.length;

  const mostCommonYearItem =
    yearDistribution.reduce<YearDistributionItem | null>((maxItem, item) => {
      if (!maxItem || item.totalCount > maxItem.totalCount) {
        return item;
      }
      return maxItem;
    }, null);

  const concentratedPeriod = getConcentratedPeriod(yearDistribution);
  const averageAgeMonths = getAverageAgeMonths(allAccounts);

  const nonMutualRate =
    totalCount > 0 ? Math.round((nonMutualCount / totalCount) * 1000) / 10 : 0;

  const mostCommonYear = mostCommonYearItem ? mostCommonYearItem.year : "-";

  return {
    totalCountText: `${totalCount.toLocaleString()}명`,
    nonMutualCountText: `${nonMutualCount.toLocaleString()}명`,
    mutualCountText: `${mutualCount.toLocaleString()}명`,
    mostCommonYear,
    mostCommonYearDesc: mostCommonYearItem
      ? `${mostCommonYearItem.totalCount.toLocaleString()}명으로 가장 많습니다.`
      : "표시할 데이터가 없습니다.",
    concentratedPeriod,
    concentratedPeriodDesc:
      concentratedPeriod === "-"
        ? "표시할 데이터가 없습니다."
        : `${selectedPeriod.label} 안에서 계정 생성이 가장 많이 몰린 시기입니다.`,
    averageAge:
      averageAgeMonths === null ? "-" : formatAgeByMonths(averageAgeMonths),
    averageAgeDesc:
      averageAgeMonths === null
        ? "표시할 데이터가 없습니다."
        : "선택한 구간에 포함된 계정의 평균 나이입니다.",
    nonMutualRate: `${nonMutualRate}%`,
    nonMutualRateDesc:
      totalCount > 0
        ? `선택 구간 ${totalCount.toLocaleString()}명 중 비맞팔 ${nonMutualCount.toLocaleString()}명입니다.`
        : "표시할 데이터가 없습니다.",
  };
}

function getConcentratedPeriod(yearDistribution: YearDistributionItem[]) {
  if (yearDistribution.length === 0) {
    return "-";
  }

  if (yearDistribution.length === 1) {
    return yearDistribution[0].year;
  }

  let bestStartPeriod = yearDistribution[0].year;
  let bestEndPeriod = yearDistribution[1].year;
  let bestCount =
    yearDistribution[0].totalCount + yearDistribution[1].totalCount;

  for (let i = 1; i < yearDistribution.length - 1; i += 1) {
    const currentCount =
      yearDistribution[i].totalCount + yearDistribution[i + 1].totalCount;

    if (currentCount > bestCount) {
      bestStartPeriod = yearDistribution[i].year;
      bestEndPeriod = yearDistribution[i + 1].year;
      bestCount = currentCount;
    }
  }

  if (bestStartPeriod === bestEndPeriod) {
    return bestStartPeriod;
  }

  return `${bestStartPeriod} ~ ${bestEndPeriod}`;
}

export type SelectedPeriodSummary = ReturnType<typeof createSelectedPeriodSummary>;
