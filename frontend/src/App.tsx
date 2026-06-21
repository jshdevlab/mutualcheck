import { useState } from "react";
import UploadPage from "./pages/UploadPage";
import DashboardPage from "./pages/DashboardPage";

export type NonMutualAccount = {
  accountId: string;
  userLink: string;
  accountCreatedDate: string;
  accountAge: string;
};

export type AnalysisResult = {
  status: string;
  message: string;
  followersCount: number;
  followingCount: number;
  mutualCount: number;
  nonMutualCount: number;
  mutualRate: number;
  nonMutualAccounts: NonMutualAccount[];
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
