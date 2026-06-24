import { useState } from "react";
import UploadPage from "./pages/UploadPage";
import DashboardPage from "./pages/DashboardPage";

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

export type AgeGroup = {
  label: string;
  totalCount: number;
  mutualCount: number;
  nonMutualCount: number;
  monthlyStats: MonthlyStat[];
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
};

function App() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null,
  );

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
