import { useMemo, useState } from "react";
import type { AnalysisResult, NonMutualAccount } from "../App";

type AccountItem = NonMutualAccount & {
  accountId?: string;
  accountCreatedDate?: string;
  accountAge?: string;
  accountAgeGroup?: string;
  isLegacyAccount?: string;
  userLink?: string;
};

type DashboardAnalysisResult = AnalysisResult & {
  mutualAccounts?: AccountItem[];
};

type PeriodKey =
  | "under30"
  | "oneToSixMonths"
  | "sixToTwelveMonths"
  | "oneToThreeYears"
  | "fourToSixYears"
  | "overSevenYears";

type PeriodBucket = {
  key: PeriodKey;
  label: string;
  minMonths: number;
  maxMonths: number | null;
};

type PeriodDistributionItem = PeriodBucket & {
  nonMutualCount: number;
  mutualCount: number;
  nonMutualRate: number;
  mutualRate: number;
  totalCount: number;
};

type YearDistributionItem = {
  year: string;
  nonMutualCount: number;
  mutualCount: number;
  totalCount: number;
};

const PERIOD_BUCKETS: PeriodBucket[] = [
  { key: "under30", label: "1개월 미만", minMonths: 0, maxMonths: 1 },
  { key: "oneToSixMonths", label: "1~5개월", minMonths: 1, maxMonths: 6 },
  { key: "sixToTwelveMonths", label: "6~11개월", minMonths: 6, maxMonths: 12 },
  { key: "oneToThreeYears", label: "1~3년", minMonths: 12, maxMonths: 48 },
  { key: "fourToSixYears", label: "4~6년", minMonths: 48, maxMonths: 84 },
  { key: "overSevenYears", label: "7년 이상", minMonths: 84, maxMonths: null },
];

export default function DashboardPage({
  analysisResult,
}: {
  analysisResult: AnalysisResult;
}) {
  const result = analysisResult as DashboardAnalysisResult;

  const nonMutualAccounts = result.nonMutualAccounts ?? [];
  const mutualAccounts = result.mutualAccounts ?? [];

  const [selectedPeriodKey, setSelectedPeriodKey] = useState<PeriodKey | null>(
    null,
  );

  const periodDistribution = useMemo(() => {
    return createPeriodDistribution(nonMutualAccounts, mutualAccounts);
  }, [nonMutualAccounts, mutualAccounts]);

  const selectedPeriod = selectedPeriodKey
    ? (periodDistribution.find((item) => item.key === selectedPeriodKey) ??
      null)
    : null;

  const selectedNonMutualAccounts = useMemo(() => {
    if (!selectedPeriod) return [];
    return filterAccountsByPeriod(nonMutualAccounts, selectedPeriod);
  }, [nonMutualAccounts, selectedPeriod]);

  const selectedMutualAccounts = useMemo(() => {
    if (!selectedPeriod) return [];
    return filterAccountsByPeriod(mutualAccounts, selectedPeriod);
  }, [mutualAccounts, selectedPeriod]);

  const yearDistribution = useMemo(() => {
    return createYearDistribution(
      selectedNonMutualAccounts,
      selectedMutualAccounts,
    );
  }, [selectedNonMutualAccounts, selectedMutualAccounts]);

  const selectedSummary = useMemo(() => {
    if (!selectedPeriod) return null;

    return createSelectedPeriodSummary(
      selectedPeriod,
      selectedNonMutualAccounts,
      selectedMutualAccounts,
      yearDistribution,
    );
  }, [
    selectedPeriod,
    selectedNonMutualAccounts,
    selectedMutualAccounts,
    yearDistribution,
  ]);

  const maxMainCount = Math.max(
    ...periodDistribution.flatMap((item) => [
      item.nonMutualCount,
      item.mutualCount,
    ]),
    1,
  );

  const mutualRateText = `${analysisResult.mutualRate}%`;
  const aiReport = createMainAiReport(periodDistribution, analysisResult);

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1000px] items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <img
              src="/main_1.png"
              alt="MutualCheck logo"
              className="h-6 w-6 object-contain"
            />
            <h1 className="text-base font-black tracking-[-0.03em]">
              MutualCheck
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1000px] space-y-3 p-3">
        <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div className="min-h-[132px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2">
            <p className="ml-4 text-xs font-bold text-slate-700">
              맞팔률{" "}
              <span className="font-semibold text-slate-500">
                (Mutual Follow Rate)
              </span>
            </p>

            <div className="mt-4 flex items-center justify-between">
              <div className="ml-3">
                <h2 className="text-4xl font-black tracking-[-0.06em] text-blue-600">
                  {mutualRateText}
                </h2>

                <p className="mt-3 text-xs font-black text-slate-500">
                  총 팔로잉 기준 맞팔 비율
                </p>
              </div>

              <div
                className="relative mr-2 h-25 w-25 shrink-0 rounded-full"
                style={{
                  background: `conic-gradient(#2563eb 0 ${analysisResult.mutualRate}%, #e8eef7 ${analysisResult.mutualRate}% 100%)`,
                }}
              >
                <div className="absolute inset-[12px] rounded-full bg-white" />
              </div>
            </div>
          </div>

          <MetricCard
            title="맞팔 계정"
            value={formatCount(analysisResult.mutualCount)}
            desc="전체 팔로잉 중 맞팔"
            icon="/following.png"
            tone="blue"
          />

          <MetricCard
            title="비맞팔 계정"
            value={formatCount(analysisResult.nonMutualCount)}
            desc="전체 팔로잉 중 비맞팔"
            icon="/unfollowing.png"
            tone="red"
          />

          <MetricCard
            title="팔로잉"
            value={formatCount(analysisResult.followingCount)}
            desc="내가 팔로우한 계정"
            icon="/main_1.png"
            tone="purple"
          />

          <MetricCard
            title="팔로워"
            value={formatCount(analysisResult.followersCount)}
            desc="나를 팔로우한 계정"
            icon="/main_2.png"
            tone="green"
          />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-2">
            <span className="text-lg">✨</span>
            <div>
              <h2 className="text-base font-black tracking-[-0.03em]">
                AI 관계 분석 리포트
              </h2>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                전체 관계 데이터를 기준으로 분석했습니다.
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-blue-100 bg-white p-4">
              <h3 className="text-sm font-black">핵심 인사이트</h3>

              <ul className="mt-3 space-y-2 text-xs font-semibold leading-5 text-slate-700">
                {aiReport.insights.map((text) => (
                  <InsightItem key={text} text={text} />
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-blue-100 bg-white p-4">
              <h3 className="text-sm font-black">종합 평가</h3>

              <p className="mt-3 text-xs font-medium leading-5 text-slate-700">
                {aiReport.evaluation}
              </p>

              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-start gap-2">
                  <span className="text-base">💡</span>
                  <div>
                    <p className="text-sm font-black">관리 팁</p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-600">
                      {aiReport.tip}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-[-0.03em]">
                  계정 분포
                </h2>
              </div>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                계정을 생성일 기준으로 나누고, 맞팔과 비맞팔을 함께 비교합니다.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-black">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-red-500" />
                <span className="text-slate-700">비맞팔</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-blue-600" />
                <span className="text-slate-700">맞팔</span>
              </div>
            </div>
          </div>

          <div className="mt-4 h-[285px]">
            <div className="relative flex h-full items-end gap-3 border-b border-slate-300 px-2">
              <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-slate-200" />
              <div className="pointer-events-none absolute inset-x-0 top-1/4 border-t border-dashed border-slate-200" />
              <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-slate-200" />
              <div className="pointer-events-none absolute inset-x-0 top-3/4 border-t border-dashed border-slate-200" />

              {periodDistribution.map((item) => {
                const nonMutualHeight =
                  (item.nonMutualCount / maxMainCount) * 180;
                const mutualHeight = (item.mutualCount / maxMainCount) * 180;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSelectedPeriodKey(item.key)}
                    className="relative flex h-full flex-1 flex-col items-center justify-end rounded-lg px-1 pb-2 transition hover:bg-blue-50/80"
                  >
                    <div className="flex w-full items-end justify-center gap-2">
                      <ChartBar
                        count={item.nonMutualCount}
                        height={nonMutualHeight}
                        colorClass="bg-red-500"
                      />

                      <ChartBar
                        count={item.mutualCount}
                        height={mutualHeight}
                        colorClass="bg-blue-600"
                      />
                    </div>

                    <p className="mt-3 whitespace-nowrap text-xs font-black text-slate-600">
                      {item.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 overflow-hidden rounded-lg border border-slate-100 text-center text-xs font-black md:grid-cols-2">
            <div className="bg-red-50 px-4 py-3 text-red-600">
              비맞팔 합계 {analysisResult.nonMutualCount.toLocaleString()}명
            </div>
            <div className="bg-blue-50 px-4 py-3 text-blue-600">
              맞팔 합계 {analysisResult.mutualCount.toLocaleString()}명
            </div>
          </div>

          <p className="mt-3 text-center text-[11px] font-semibold text-black">
            ※ 막대를 클릭하면 선택한 구간의 상세 분석을 확인할 수 있습니다.
          </p>
        </section>
      </main>

      {selectedPeriod && selectedSummary && (
        <PeriodDetailModal
          selectedPeriod={selectedPeriod}
          yearDistribution={yearDistribution}
          selectedSummary={selectedSummary}
          onClose={() => setSelectedPeriodKey(null)}
        />
      )}
    </div>
  );
}

function PeriodDetailModal({
  selectedPeriod,
  yearDistribution,
  selectedSummary,
  onClose,
}: {
  selectedPeriod: PeriodDistributionItem;
  yearDistribution: YearDistributionItem[];
  selectedSummary: ReturnType<typeof createSelectedPeriodSummary>;
  onClose: () => void;
}) {
  const [showAllMonths, setShowAllMonths] = useState(false);

  const visibleYearDistribution = showAllMonths
    ? yearDistribution
    : yearDistribution.slice(0, 8);

  const maxYearCount = Math.max(
    ...yearDistribution.map((item) => item.totalCount),
    1,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div className="flex max-h-[80vh] w-full max-w-[750px] flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="shrink-0 flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-black tracking-[-0.03em]">
              {selectedPeriod.label} 구간 상세 분석
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              선택한 구간에 포함된 계정을 생성 월별로 나눠 보여줍니다.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-black text-slate-500 transition hover:bg-slate-50"
          >
            ❌
          </button>
        </div>

        <div className="shrink-0 border-b border-slate-100 px-5 py-3">
          <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-slate-100 text-center text-xs font-black md:grid-cols-3">
            <div className="bg-slate-50 px-3 py-2 text-slate-600">
              선택 구간 합계 {selectedSummary.totalCountText}
            </div>
            <div className="bg-red-50 px-3 py-2 text-red-600">
              비맞팔 {selectedSummary.nonMutualCountText}
            </div>
            <div className="bg-blue-50 px-3 py-2 text-blue-600">
              맞팔 {selectedSummary.mutualCountText}
            </div>
          </div>

          <p className="mt-3 text-center text-xs font-semibold text-slate-500">
            집중 생성 시기{" "}
            <span className="font-black text-emerald-600">
              {selectedSummary.concentratedPeriod}
            </span>
            <span className="mx-2 text-slate-300">|</span>
            평균 계정 나이{" "}
            <span className="font-black text-orange-600">
              {selectedSummary.averageAge}
            </span>
            <span className="mx-2 text-slate-300">|</span>
            비맞팔 비율{" "}
            <span className="font-black text-red-600">
              {selectedSummary.nonMutualRate}
            </span>
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black">생성 시기별 분포</h3>

              <div className="flex items-center gap-4 text-xs font-black">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-red-500" />
                  <span className="text-slate-700">비맞팔</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-blue-600" />
                  <span className="text-slate-700">맞팔</span>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {yearDistribution.length > 0 ? (
                <>
                  {visibleYearDistribution.map((item) => {
                    const totalWidth = (item.totalCount / maxYearCount) * 100;
                    const nonMutualWidth =
                      item.totalCount > 0
                        ? (item.nonMutualCount / item.totalCount) * 100
                        : 0;
                    const mutualWidth =
                      item.totalCount > 0
                        ? (item.mutualCount / item.totalCount) * 100
                        : 0;

                    return (
                      <div
                        key={item.year}
                        className="grid grid-cols-[64px_1fr_86px] items-center gap-3"
                      >
                        <p className="text-xs font-black text-slate-600">
                          {item.year}
                        </p>

                        <div className="h-5 rounded-full bg-slate-100">
                          <div
                            className="flex h-5 overflow-hidden rounded-full"
                            style={{ width: `${Math.max(totalWidth, 4)}%` }}
                          >
                            <div
                              className="flex h-full items-center justify-center bg-red-500 text-[10px] font-black text-white"
                              style={{ width: `${nonMutualWidth}%` }}
                            >
                              {item.nonMutualCount > 0
                                ? formatCount(item.nonMutualCount)
                                : ""}
                            </div>
                            <div
                              className="flex h-full items-center justify-center bg-blue-600 text-[10px] font-black text-white"
                              style={{ width: `${mutualWidth}%` }}
                            >
                              {item.mutualCount > 0
                                ? formatCount(item.mutualCount)
                                : ""}
                            </div>
                          </div>
                        </div>

                        <p className="text-right text-xs font-black text-slate-700">
                          {formatCount(item.totalCount)}명
                        </p>
                      </div>
                    );
                  })}

                  {yearDistribution.length > 8 && (
                    <button
                      type="button"
                      onClick={() => setShowAllMonths((prev) => !prev)}
                      className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-50"
                    >
                      {showAllMonths ? "접기" : `전체 보기`}
                    </button>
                  )}
                </>
              ) : (
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-8 text-center">
                  <p className="text-sm font-black text-slate-600">
                    선택한 기간에 표시할 계정이 없습니다.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartBar({
  count,

  height,
  colorClass,
}: {
  count: number;

  height: number;
  colorClass: string;
}) {
  return (
    <div className="flex w-[42px] flex-col items-center">
      <div className="mb-2 text-center text-[11px] font-black leading-4 text-slate-700">
        <p>{formatCount(count)}</p>
      </div>

      <div
        className={`w-full rounded-t-md shadow-sm ${colorClass}`}
        style={{
          height: `${Math.max(height, count > 0 ? 8 : 0)}px`,
        }}
      />
    </div>
  );
}

function MetricCard({
  title,
  value,
  desc,
  icon,
  tone,
}: {
  title: string;
  value: string;
  desc: string;
  icon: string;
  tone: "blue" | "red" | "green" | "purple";
}) {
  const toneClass = {
    blue: "bg-blue-50",
    red: "bg-red-50",
    green: "bg-emerald-50",
    purple: "bg-violet-50",
  }[tone];

  return (
    <div className="min-h-[132px] rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
      <div className="flex justify-center">
        <div
          className={`mt-4 flex h-10 w-10 items-center justify-center rounded-full ${toneClass}`}
        >
          <img src={icon} alt={title} className="h-6 w-6 object-contain" />
        </div>
      </div>

      <p className="mt-3 text-xs font-black text-slate-700">{title}</p>
      <h3 className="mt-3 text-xl font-black tracking-[-0.01em]">{value}</h3>
      <p className="mt-2 text-[11px] font-bold text-slate-500">{desc}</p>
    </div>
  );
}

function InsightItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 font-black text-blue-600">✓</span>
      <span>{text}</span>
    </li>
  );
}

function createPeriodDistribution(
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

function filterAccountsByPeriod<T extends AccountItem>(
  accounts: T[],
  bucket: PeriodBucket,
): T[] {
  return accounts.filter((account) => {
    if (account.isLegacyAccount === "true") {
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

function createYearDistribution(
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

function createSelectedPeriodSummary(
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

function createMainAiReport(
  periodDistribution: PeriodDistributionItem[],
  analysisResult: AnalysisResult,
) {
  const largestNonMutualBucket =
    periodDistribution.reduce<PeriodDistributionItem | null>(
      (maxItem, item) => {
        if (!maxItem || item.nonMutualCount > maxItem.nonMutualCount) {
          return item;
        }
        return maxItem;
      },
      null,
    );

  const highestNonMutualRateBucket =
    periodDistribution.reduce<PeriodDistributionItem | null>(
      (maxItem, item) => {
        const itemRate =
          item.totalCount > 0 ? item.nonMutualCount / item.totalCount : 0;
        const maxRate =
          maxItem && maxItem.totalCount > 0
            ? maxItem.nonMutualCount / maxItem.totalCount
            : 0;

        if (!maxItem || itemRate > maxRate) {
          return item;
        }

        return maxItem;
      },
      null,
    );

  const nonMutualShare =
    analysisResult.followingCount > 0
      ? Math.round(
          (analysisResult.nonMutualCount / analysisResult.followingCount) *
            1000,
        ) / 10
      : 0;

  return {
    insights: [
      `전체 팔로잉 ${analysisResult.followingCount.toLocaleString()}명 중 비맞팔 계정은 ${analysisResult.nonMutualCount.toLocaleString()}명입니다.`,
      `현재 맞팔률은 ${analysisResult.mutualRate}%이고, 비맞팔 비율은 ${nonMutualShare}%입니다.`,
      largestNonMutualBucket
        ? `${largestNonMutualBucket.label} 구간에서 비맞팔 계정 수가 가장 많습니다.`
        : "계정 연령 구간을 계산할 수 없습니다.",
      highestNonMutualRateBucket
        ? `${highestNonMutualRateBucket.label} 구간은 맞팔 대비 비맞팔 비중이 상대적으로 높습니다.`
        : "비맞팔 비중이 높은 구간을 계산할 수 없습니다.",
    ],
    evaluation:
      "전체 관계는 맞팔 계정과 비맞팔 계정이 함께 분포되어 있습니다. 단순히 비맞팔 수만 보는 것보다 계정 연령 구간별로 맞팔과 비맞팔을 비교하면 정리 우선순위를 더 명확히 판단할 수 있습니다.",
    tip: largestNonMutualBucket
      ? `${largestNonMutualBucket.label} 구간을 먼저 확인하면 오래된 비맞팔 후보를 효율적으로 점검할 수 있습니다.`
      : "계정 생성일이 있는 데이터부터 우선 확인하는 것이 좋습니다.",
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

function getAverageAgeMonths(accounts: AccountItem[]) {
  const ageMonthsList = accounts
    .map((account) => parseAccountCreatedDate(account.accountCreatedDate))
    .filter((date): date is Date => Boolean(date))
    .map((date) => getAgeInMonths(date));

  if (ageMonthsList.length === 0) {
    return null;
  }

  const totalMonths = ageMonthsList.reduce((sum, months) => sum + months, 0);

  return Math.round(totalMonths / ageMonthsList.length);
}

function getAccountCreatedPeriodLabel(account: AccountItem) {
  if (account.isLegacyAccount === "true") {
    return "2010년 이전";
  }

  const date = parseAccountCreatedDate(account.accountCreatedDate);

  if (!date) {
    return null;
  }

  const year = date.getFullYear();

  if (year <= 2010) {
    return "2010년 이전";
  }

  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}.${month}`;
}

function getPeriodSortValue(label: string) {
  if (label === "2010년 이전") {
    return 201000;
  }

  const match = label.match(/^(\d{4})\.(\d{2})$/);

  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  return Number(match[1]) * 100 + Number(match[2]);
}

function parseAccountCreatedDate(dateText?: string) {
  if (!dateText) {
    return null;
  }

  const normalized = dateText.trim();

  const dotMatch = normalized.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/);
  if (dotMatch) {
    return new Date(
      Number(dotMatch[1]),
      Number(dotMatch[2]) - 1,
      Number(dotMatch[3]),
    );
  }

  const dashMatch = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (dashMatch) {
    return new Date(
      Number(dashMatch[1]),
      Number(dashMatch[2]) - 1,
      Number(dashMatch[3]),
    );
  }

  const parsedDate = new Date(normalized);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

function getAgeInMonths(date: Date) {
  const now = new Date();

  let months =
    (now.getFullYear() - date.getFullYear()) * 12 +
    (now.getMonth() - date.getMonth());

  if (now.getDate() < date.getDate()) {
    months -= 1;
  }

  return Math.max(months, 0);
}

function formatAgeByMonths(totalMonths: number) {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (years <= 0) {
    return `${months}개월`;
  }

  if (months <= 0) {
    return `${years}년`;
  }

  return `${years}년 ${months}개월`;
}

function formatCount(value: number) {
  if (value >= 1000000) {
    return `${Math.round(value / 100000) / 10}M`;
  }

  if (value >= 1000) {
    return `${Math.round(value / 100) / 10}K`;
  }

  return value.toLocaleString();
}
