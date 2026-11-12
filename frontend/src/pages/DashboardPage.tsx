// 대시보드 화면을 구성하고 선택 기간에 따른 상세 분석 상태를 관리
import { useMemo, useState } from "react";
import type { AnalysisResult } from "../App";
import type { DashboardAnalysisResult, PeriodKey } from "../types/dashboard";
import {
  createPeriodDistribution,
  createSelectedPeriodSummary,
  createYearDistribution,
  filterAccountsByPeriod,
} from "../utils/accountDistribution";
import SummaryCards from "../components/dashboard/SummaryCards";
import AiReportSection from "../components/dashboard/AiReportSection";
import AccountDistribution from "../components/dashboard/AccountDistribution";
import PeriodDetailModal from "../components/dashboard/PeriodDetailModal";

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

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1000px] items-center justify-between px-4 py-1">
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

      <main className="mx-auto w-full max-w-[1000px] space-y-2 p-2">
        <SummaryCards analysisResult={analysisResult} />
        <AiReportSection
          analysisResult={analysisResult}
          periodDistribution={periodDistribution}
        />
        <AccountDistribution
          analysisResult={analysisResult}
          periodDistribution={periodDistribution}
          onSelectPeriod={setSelectedPeriodKey}
        />
      </main>

      {selectedPeriod && selectedSummary && (
        <PeriodDetailModal
          selectedPeriod={selectedPeriod}
          yearDistribution={yearDistribution}
          selectedSummary={selectedSummary}
          selectedNonMutualAccounts={selectedNonMutualAccounts}
          selectedMutualAccounts={selectedMutualAccounts}
          onClose={() => setSelectedPeriodKey(null)}
        />
      )}
    </div>
  );
}
