// 계정 생성 기간별 맞팔/비맞팔 막대그래프와 구간 선택 UI
import type { AnalysisResult } from "../../App";
import type { PeriodDistributionItem, PeriodKey } from "../../types/dashboard";
import ChartBar from "./ChartBar";

export default function AccountDistribution({
  analysisResult,
  periodDistribution,
  onSelectPeriod,
}: {
  analysisResult: AnalysisResult;
  periodDistribution: PeriodDistributionItem[];
  onSelectPeriod: (key: PeriodKey) => void;
}) {
  const maxMainCount = Math.max(
    ...periodDistribution.flatMap((item) => [
      item.nonMutualCount,
      item.mutualCount,
    ]),
    1,
  );

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-base font-black tracking-[-0.03em]">
              계정 분포
            </h2>

            <p className="text-[11px] font-semibold text-slate-500">
              ※ 막대를 클릭하면 선택한 구간의 상세 분석을 확인할 수 있습니다.
            </p>
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

      <div className="mt-3 h-[230px]">
        <div className="relative flex h-full items-end gap-3 border-b border-slate-300 px-2">
          <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-slate-200" />
          <div className="pointer-events-none absolute inset-x-0 top-1/4 border-t border-dashed border-slate-200" />
          <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-slate-200" />
          <div className="pointer-events-none absolute inset-x-0 top-3/4 border-t border-dashed border-slate-200" />

          {periodDistribution.map((item) => {
            const nonMutualHeight = (item.nonMutualCount / maxMainCount) * 140;
            const mutualHeight = (item.mutualCount / maxMainCount) * 140;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSelectPeriod(item.key)}
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

      <div className="mt-3 grid grid-cols-1 overflow-hidden rounded-lg border border-slate-100 text-center text-xs font-black md:grid-cols-2">
        <div className="bg-red-50 px-4 py-2 text-red-600">
          비맞팔 합계 {analysisResult.nonMutualCount.toLocaleString()}명
        </div>
        <div className="bg-blue-50 px-4 py-2 text-blue-600">
          맞팔 합계 {analysisResult.mutualCount.toLocaleString()}명
        </div>
      </div>
    </section>
  );
}
