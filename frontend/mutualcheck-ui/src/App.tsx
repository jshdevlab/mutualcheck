import { useState } from "react";
import UploadPage from "./pages/UploadPage";
import DashboardPage from "./pages/DashboardPage";

function App() {
  const [hasAnalysis, setHasAnalysis] = useState(false);

  return (
    <>
      {hasAnalysis ? (
        <DashboardPage />
      ) : (
        <UploadPage onAnalysisComplete={() => setHasAnalysis(true)} />
      )}
    </>
  );
}

export default App;
