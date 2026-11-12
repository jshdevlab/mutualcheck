// 관리자 분석·AI 사용량 요약 및 상태 카드
import type { SummaryData } from "../../types/admin";
import AdminMetricCard from "./AdminMetricCard";

function AdminSummary({
  summary,
  loading,
}: {
  summary: SummaryData | null;
  loading: boolean;
}) {
  return (
    <>
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard
          title="오늘 분석"
          value={
            loading && !summary
              ? "-"
              : `${(summary?.todayAnalysisCount ?? 0).toLocaleString()}회`
          }
        />

        <AdminMetricCard
          title="이번 달 분석"
          value={
            loading && !summary
              ? "-"
              : `${(summary?.monthAnalysisCount ?? 0).toLocaleString()}회`
          }
        />

        <AdminMetricCard
          title="오늘 AI 호출"
          value={
            loading && !summary
              ? "-"
              : `${(summary?.todayAiCallCount ?? 0).toLocaleString()} / ${(summary?.dailyAiLimit ?? 300).toLocaleString()}`
          }
        />

        <AdminMetricCard
          title="이번 달 AI 호출"
          value={
            loading && !summary
              ? "-"
              : `${(summary?.monthAiCallCount ?? 0).toLocaleString()} / ${(summary?.monthlyAiLimit ?? 5000).toLocaleString()}`
          }
        />
      </section>

      <section>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminMetricCard
            title="AI 성공"
            value={
              loading && !summary
                ? "-"
                : `${(summary?.aiSuccessCount ?? 0).toLocaleString()}회`
            }
          />

          <AdminMetricCard
            title="AI 실패"
            value={
              loading && !summary
                ? "-"
                : `${(summary?.aiFailureCount ?? 0).toLocaleString()}회`
            }
          />

          <AdminMetricCard
            title="한도 차단"
            value={
              loading && !summary
                ? "-"
                : `${(summary?.aiBlockedCount ?? 0).toLocaleString()}회`
            }
          />

          <AdminMetricCard
            title="이번 달 AI 비용"
            value={
              loading && !summary
                ? "-"
                : `$${(summary?.monthAiCostUsd ?? 0).toFixed(6)}`
            }
          />
        </div>
      </section>
    </>
  );
}

export default AdminSummary;
