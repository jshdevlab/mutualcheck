// AI 응답 본문 파싱 및 AI 호출 실패 시 기본 분석 문구 생성
import type { AnalysisResult } from "../App";
import type { MainAiReport, PeriodDistributionItem } from "../types/dashboard";

export function parseAiReportText(reportText: string): MainAiReport {
  const normalizedText = reportText.trim();

  if (!normalizedText) {
    return {
      insights: ["AI 리포트 내용이 비어 있습니다."],
      evaluation: "기본 분석 결과를 기준으로 관계 상태를 확인해 주세요.",
      tip: "계정 분포 차트에서 비맞팔 비율이 높은 구간부터 점검하는 것이 좋습니다.",
    };
  }

  const insightMatch = normalizedText.match(
    /1\.\s*핵심\s*인사이트\s*:?([\s\S]*?)(?=\s*2\.\s*종합\s*평가\s*:|$)/,
  );

  const evaluationMatch = normalizedText.match(
    /2\.\s*종합\s*평가\s*:?([\s\S]*?)(?=\s*3\.\s*관리\s*팁\s*:|$)/,
  );

  const tipMatch = normalizedText.match(/3\.\s*관리\s*팁\s*:?([\s\S]*)$/);

  const insightText = cleanupAiSection(insightMatch?.[1] ?? "");
  const evaluation = cleanupAiSection(evaluationMatch?.[1] ?? normalizedText);
  const tip = cleanupAiSection(tipMatch?.[1] ?? "");

  const insights = insightText
    .split(/\n+/)
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);

  return {
    insights: insights.length > 0 ? insights : [evaluation],
    evaluation,
    tip:
      tip ||
      "비맞팔 수만 기준으로 판단하지 말고, 계정 생성 구간별 분포를 함께 확인하세요.",
  };
}

function cleanupAiSection(value: string) {
  return value
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*/g, "")
    .replace(/```/g, "")
    .replace(/^[-•*]\s*$/gm, "")
    .trim();
}

export function createMainAiReport(
  periodDistribution: PeriodDistributionItem[],
  analysisResult: AnalysisResult,
): MainAiReport {
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
