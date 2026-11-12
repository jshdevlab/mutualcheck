// 대시보드 화면에서 사용하는 분석 결과 및 기간별 통계 타입
import type { AnalysisResult, NonMutualAccount } from "../App";

export type RelationType = "mutual" | "nonMutual";

export type AnalysisAccount = {
  accountId?: string;
  userLink?: string;
  accountCreatedDate?: string;
  accountAge?: string;
  accountAgeGroup?: string;
  isLegacyAccount?: string | boolean;
  relation?: RelationType;
};

export type MonthlyStat = {
  month: string;
  totalCount: number;
  mutualCount: number;
  nonMutualCount: number;
  accounts: AnalysisAccount[];
};

export type AgeGroup = {
  label: string;
  totalCount: number;
  mutualCount: number;
  nonMutualCount: number;
  monthlyStats: MonthlyStat[];
};

export type AccountItem = NonMutualAccount & AnalysisAccount;

export type DashboardAnalysisResult = AnalysisResult & {
  mutualAccounts?: AccountItem[];
  nonMutualAccounts?: AccountItem[];
  ageGroups?: AgeGroup[];
};

export type PeriodKey =
  | "under30"
  | "oneToSixMonths"
  | "sixToTwelveMonths"
  | "oneToThreeYears"
  | "fourToSixYears"
  | "overSevenYears";

export type PeriodBucket = {
  key: PeriodKey;
  label: string;
  minMonths: number;
  maxMonths: number | null;
};

export type PeriodDistributionItem = PeriodBucket & {
  nonMutualCount: number;
  mutualCount: number;
  nonMutualRate: number;
  mutualRate: number;
  totalCount: number;
};

export type YearDistributionItem = {
  year: string;
  nonMutualCount: number;
  mutualCount: number;
  totalCount: number;
};

export type MainAiReport = {
  insights: string[];
  evaluation: string;
  tip: string;
};
