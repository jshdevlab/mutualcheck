// 선택 기간의 생성 월별 분포, 계정 목록, 정렬을 보여주는 상세 모달
import { useMemo, useState } from "react";
import type { AccountItem, PeriodDistributionItem, YearDistributionItem } from "../../types/dashboard";
import type { SelectedPeriodSummary } from "../../utils/accountDistribution";
import {
  createAccountRowCreatedLabel,
  createXProfileUrl,
  getAccountCreatedPeriodLabel,
  parseAccountCreatedDate,
} from "../../utils/accountDate";
import { formatCount } from "../../utils/format";

export default function PeriodDetailModal({
  selectedPeriod,
  yearDistribution,
  selectedSummary,
  selectedNonMutualAccounts,
  selectedMutualAccounts,
  onClose,
}: {
  selectedPeriod: PeriodDistributionItem;
  yearDistribution: YearDistributionItem[];
  selectedSummary: SelectedPeriodSummary;
  selectedNonMutualAccounts: AccountItem[];
  selectedMutualAccounts: AccountItem[];
  onClose: () => void;
}) {
  const [showAllMonths, setShowAllMonths] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [relationSort, setRelationSort] = useState<"asc" | "desc">("asc");

  const visibleYearDistribution = showAllMonths
    ? yearDistribution
    : yearDistribution.slice(0, 8);

  const selectedMonthAccounts = useMemo(() => {
    if (!selectedYear) return [];

    return [
      ...selectedNonMutualAccounts.map((account) => ({
        account,
        relationLabel: "비맞팔",
        relationClassName: "bg-red-50 text-red-600",
        relationOrder: 0,
      })),
      ...selectedMutualAccounts.map((account) => ({
        account,
        relationLabel: "맞팔",
        relationClassName: "bg-blue-50 text-blue-600",
        relationOrder: 1,
      })),
    ]
      .filter(
        (item) => getAccountCreatedPeriodLabel(item.account) === selectedYear,
      )
      .sort((a, b) => {
        if (a.relationOrder !== b.relationOrder) {
          return relationSort === "asc"
            ? a.relationOrder - b.relationOrder
            : b.relationOrder - a.relationOrder;
        }

        const aTime =
          parseAccountCreatedDate(a.account.accountCreatedDate)?.getTime() ?? 0;

        const bTime =
          parseAccountCreatedDate(b.account.accountCreatedDate)?.getTime() ?? 0;

        return aTime - bTime;
      });
  }, [
    selectedYear,
    selectedNonMutualAccounts,
    selectedMutualAccounts,
    relationSort,
  ]);

  const maxYearCount = Math.max(
    ...yearDistribution.map((item) => item.totalCount),
    1,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div className="flex max-h-[95vh] w-full max-w-[750px] flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl">
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
                    const totalWidth =
                      item.totalCount > 0
                        ? (Math.log1p(item.totalCount) /
                            Math.log1p(maxYearCount)) *
                          100
                        : 0;
                    const nonMutualWidth =
                      item.totalCount > 0
                        ? (item.nonMutualCount / item.totalCount) * 100
                        : 0;
                    const mutualWidth =
                      item.totalCount > 0
                        ? (item.mutualCount / item.totalCount) * 100
                        : 0;

                    const isSelected = selectedYear === item.year;

                    return (
                      <div key={item.year}>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedYear((prev) =>
                              prev === item.year ? null : item.year,
                            )
                          }
                          className={`grid w-full grid-cols-[64px_1fr_86px] items-center gap-3 rounded-lg px-1 py-1 text-left transition ${
                            isSelected
                              ? "bg-slate-100 ring-1 ring-slate-200"
                              : "hover:bg-slate-50"
                          }`}
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
                        </button>

                        {isSelected && (
                          <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <p className="text-sm font-black text-slate-800">
                                {item.year} 계정{" "}
                                {selectedMonthAccounts.length.toLocaleString()}
                                개
                              </p>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setRelationSort("asc")}
                                  className={`text-xs font-black transition ${
                                    relationSort === "asc"
                                      ? "text-slate-700"
                                      : "text-slate-300 hover:text-slate-600"
                                  }`}
                                  title="비맞팔 먼저"
                                >
                                  ▲
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setRelationSort("desc")}
                                  className={`text-xs font-black transition ${
                                    relationSort === "desc"
                                      ? "text-slate-700"
                                      : "text-slate-300 hover:text-slate-600"
                                  }`}
                                  title="맞팔 먼저"
                                >
                                  ▼
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setSelectedYear(null)}
                                  className="text-xs font-black text-slate-400 transition hover:text-slate-700"
                                >
                                  닫기
                                </button>
                              </div>
                            </div>

                            {selectedMonthAccounts.length > 0 ? (
                              <div className="max-h-[220px] space-y-2 overflow-y-auto pr-1">
                                {selectedMonthAccounts.map(
                                  (accountItem, index) => {
                                    const profileUrl = createXProfileUrl(
                                      accountItem.account,
                                    );
                                    const createdLabel =
                                      createAccountRowCreatedLabel(
                                        accountItem.account,
                                      );

                                    return (
                                      <div
                                        key={`${accountItem.account.accountId ?? "account"}-${index}`}
                                        className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2"
                                      >
                                        <div className="min-w-0">
                                          <p className="truncate text-xs font-black text-slate-700">
                                            {createdLabel}
                                          </p>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-2">
                                          <span
                                            className={`rounded-full px-2 py-1 text-[11px] font-black ${accountItem.relationClassName}`}
                                          >
                                            {accountItem.relationLabel}
                                          </span>

                                          {profileUrl ? (
                                            <a
                                              href={profileUrl}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-black text-white transition hover:bg-slate-700"
                                              onClick={(event) =>
                                                event.stopPropagation()
                                              }
                                            >
                                              X에서 확인
                                            </a>
                                          ) : (
                                            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-400">
                                              링크 없음
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            ) : (
                              <div className="rounded-lg border border-slate-100 bg-white px-4 py-6 text-center">
                                <p className="text-xs font-black text-slate-500">
                                  선택한 월에 표시할 계정이 없습니다.
                                </p>
                              </div>
                            )}
                          </div>
                        )}
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
