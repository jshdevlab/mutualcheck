// 관리자 요약, 월별/연도별 추이, 최근 오류 로그 데이터 타입
export type UsageData = {
  date: string;
  count: number;
};

export type ErrorLog = {
  occurredAt: string;
  type: "ANALYSIS" | "AI";
  message: string;
};

export type SummaryData = {
  todayAnalysisCount: number;
  monthAnalysisCount: number;

  todayAiCallCount: number;
  monthAiCallCount: number;

  dailyAiLimit: number;
  monthlyAiLimit: number;

  aiSuccessCount: number;
  aiFailureCount: number;
  aiBlockedCount: number;

  monthAiCostUsd: number;
};

export type MonthlyData = {
  analysisTrend: UsageData[];
  aiTrend: UsageData[];
};

export type YearlyData = {
  analysisTrend: UsageData[];
  aiTrend: UsageData[];
};
