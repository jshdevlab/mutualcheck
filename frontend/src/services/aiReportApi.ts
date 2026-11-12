// AI API 호출 및 429 오류 처리
import type { AnalysisResult } from "../App";

export class AiReportLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiReportLimitError";
  }
}

export const fetchAiReport = async (result: AnalysisResult) => {
  const response = await fetch("http://localhost:8080/api/ai-report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      followersCount: result.followersCount,
      followingCount: result.followingCount,
      mutualCount: result.mutualCount,
      nonMutualCount: result.nonMutualCount,
      mutualRate: result.mutualRate,
      nonMutualYearStats: result.nonMutualYearStats,

      ageGroups: result.ageGroups.map((group) => {
        const nonMutualRate =
          group.totalCount === 0
            ? 0
            : (group.nonMutualCount * 100) / group.totalCount;

        return {
          label: group.label,
          totalCount: group.totalCount,
          mutualCount: group.mutualCount,
          nonMutualCount: group.nonMutualCount,
          nonMutualRate,
          nonMutualRateText: `${nonMutualRate.toFixed(1)}%`,
          yearStats: group.yearStats ?? [],
        };
      }),
    }),
  });

  if (response.status === 429) {
    let message = "현재 AI 이용 한도에 도달했습니다.";

    try {
      const errorData: {
        detail?: string;
        message?: string;
      } = await response.json();

      if (errorData.detail) {
        message = errorData.detail;
      } else if (errorData.message) {
        message = errorData.message;
      }
    } catch {
      // 429 응답 본문을 읽지 못하면 기본 메시지를 사용한다.
    }

    throw new AiReportLimitError(message);
  }

  if (!response.ok) {
    throw new Error("AI 리포트 생성에 실패했습니다.");
  }

  const aiData: { report: string } = await response.json();

  return aiData.report;
};
