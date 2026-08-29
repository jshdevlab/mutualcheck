import { useState } from "react";
import UploadPage from "./pages/UploadPage";
import DashboardPage from "./pages/DashboardPage";
import AdminPage from "./pages/AdminPage";

export type AccountRelation = "mutual" | "nonMutual";

export type AnalysisAccount = {
  accountCreatedDate: string;
  accountAge: string;
  relation: AccountRelation;
  userLink: string;
  isLegacyAccount: string | boolean;
};

export type MonthlyStat = {
  month: string;
  totalCount: number;
  mutualCount: number;
  nonMutualCount: number;
  accounts: AnalysisAccount[];
};

export type YearStat = {
  year: string;
  totalCount: number;
  mutualCount: number;
  nonMutualCount: number;
  nonMutualRate?: number;
  nonMutualRateText?: string;
  coverageCount?: number;
  coverageRate?: number;
  coverageRateText?: string;
};

export type AgeGroup = {
  label: string;
  totalCount: number;
  mutualCount: number;
  nonMutualCount: number;
  monthlyStats: MonthlyStat[];
  yearStats: YearStat[];
};

export type NonMutualAccount = {
  accountId: string;
  userLink: string;
  accountCreatedDate: string;
  accountAge: string;
  accountAgeGroup: string;
  isLegacyAccount: string | boolean;
};

export type AnalysisResult = {
  status: string;
  message: string;
  followersCount: number;
  followingCount: number;
  mutualCount: number;
  nonMutualCount: number;
  mutualRate: number;
  mutualAccounts: NonMutualAccount[];
  nonMutualAccounts: NonMutualAccount[];
  ageGroups: AgeGroup[];
  nonMutualYearStats: YearStat[];
  aiReport?: string;
};

function App() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null,
  );

  const isAdminPage = window.location.pathname === "/admin";

  if (isAdminPage) {
    return <AdminPage />;
  }

  return (
    <>
      {analysisResult ? (
        <DashboardPage analysisResult={analysisResult} />
      ) : (
        <UploadPage
          onAnalysisComplete={(result: AnalysisResult) => {
            setAnalysisResult(result);
          }}
        />
      )}
    </>
  );
}

export default App;
