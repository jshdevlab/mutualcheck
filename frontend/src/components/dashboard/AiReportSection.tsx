// AI 리포트의 핵심 인사이트·종합 평가·관리 팁 표시
import { useMemo } from "react";
import type { AnalysisResult } from "../../App";
import type { PeriodDistributionItem } from "../../types/dashboard";
import { createMainAiReport, parseAiReportText } from "../../utils/aiReportParser";
import InsightItem from "./InsightItem";

export default function AiReportSection({ analysisResult, periodDistribution }: {
  analysisResult: AnalysisResult;
  periodDistribution: PeriodDistributionItem[];
}) {
  const fallbackAiReport = useMemo(() => {
    return createMainAiReport(periodDistribution, analysisResult);
  }, [periodDistribution, analysisResult]);

  const savedAiReportText = (
    analysisResult as AnalysisResult & {
      aiReport?: string;
    }
  ).aiReport;

  const aiReport = useMemo(() => {
    if (!savedAiReportText) {
      return fallbackAiReport;
    }

    return parseAiReportText(savedAiReportText);
  }, [savedAiReportText, fallbackAiReport]);

  return (
        <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-start gap-2">
            <span className="text-lg">✨</span>
            <div>
              <h2 className="text-base font-black tracking-[-0.03em]">
                AI 관계 분석 리포트
              </h2>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                {savedAiReportText
                  ? "업로드 분석 과정에서 생성된 AI 리포트입니다."
                  : "AI 호출 실패로 기본 분석을 표시합니다."}
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-blue-100 bg-white p-3">
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
                <div className="flex items-center gap-2">
                  <span className="text-sm">💡</span>
                  <p className="text-sm font-black">관리 팁</p>
                </div>

                <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                  {aiReport.tip}
                </p>
              </div>
            </div>
          </div>
        </section>
  );
}
