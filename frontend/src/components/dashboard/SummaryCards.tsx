// 대시보드 상단 맞팔률과 주요 계정 수치 카드
import type { AnalysisResult } from "../../App";
import { formatCount } from "../../utils/format";
import MetricCard from "./MetricCard";

export default function SummaryCards({ analysisResult }: { analysisResult: AnalysisResult }) {
  const mutualRateText = `${analysisResult.mutualRate}%`;

  return (
        <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div className="min-h-[118px] rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
            <p className="ml-4 text-xs font-bold text-slate-700">
              맞팔률{" "}
              <span className="font-semibold text-slate-500">
                (Mutual Follow Rate)
              </span>
            </p>

            <div className="mt-3 flex items-center justify-between">
              <div className="ml-3">
                <h2 className="text-4xl font-black tracking-[-0.06em] text-blue-600">
                  {mutualRateText}
                </h2>

                <p className="mt-4 text-xs font-black text-slate-500">
                  총 팔로잉 기준 맞팔 비율
                </p>
              </div>

              <div
                className="relative mr-2 h-20 w-20 shrink-0 rounded-full"
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
  );
}
