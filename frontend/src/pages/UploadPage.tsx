import { useRef, useState } from "react";
import type { AnalysisResult } from "../App";
import AnalyzeModal from "./AnalyzeModal";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function UploadPage({
  onAnalysisComplete,
}: {
  onAnalysisComplete: (result: AnalysisResult) => void;
}) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState(0);
  const isCanceledRef = useRef(false);

  const handleStartAnalyzeModal = () => {
    isCanceledRef.current = false;
    setAnalyzeStep(0);
    setIsAnalyzing(true);
  };

  const handleCancelAnalyze = () => {
    isCanceledRef.current = true;
    setIsAnalyzing(false);
  };

  const handleAnalysisSuccess = (result: AnalysisResult) => {
    if (isCanceledRef.current) {
      return;
    }

    setIsAnalyzing(false);
    onAnalysisComplete(result);
  };

  const handleAnalysisFail = () => {
    isCanceledRef.current = true;
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-slate-950">
      {isAnalyzing && (
        <AnalyzeModal step={analyzeStep} onCancel={handleCancelAnalyze} />
      )}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1000px] items-center justify-between px-4 py-1">
          <div className="flex items-center gap-2">
            <img
              src="/main_1.png"
              alt="MutualCheck logo"
              className="h-6 w-6 object-contain"
            />

            <h1 className="text-base font-black tracking-[-0.03em]">
              MutualCheck
            </h1>
          </div>
        </div>
      </header>

      <main className="px-2 py-8">
        <section className="mx-auto grid max-w-[1000px] grid-cols-1 gap-2 lg:grid-cols-[520px_420px] lg:items-start lg:justify-center">
          <div>
            <div className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
              X(구 트위터) 맞팔 관계 분석 도구
            </div>

            <h1 className="mt-6 text-4xl font-black leading-[1.12] tracking-[-0.055em] text-slate-950">
              맞팔 상태를 확인하고
              <br />
              AI 추천 결과를 살펴보세요.
            </h1>

            <p className="mt-5 max-w-[680px] text-base leading-7 text-slate-600">
              파일을 기반으로 맞팔률과 비맞팔 기간 분포를 확인할 수 있습니다.
            </p>

            <div className="mt-8 max-w-[500px] space-y-4">
              <UsageCard />
              <DataPolicyCard />
            </div>
          </div>

          <div className="lg:pt-[75px]">
            <UploadCard
              onAnalysisStart={handleStartAnalyzeModal}
              onAnalysisSuccess={handleAnalysisSuccess}
              onAnalysisFail={handleAnalysisFail}
              setAnalyzeStep={setAnalyzeStep}
              isCanceledRef={isCanceledRef}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function UploadCard({
  onAnalysisStart,
  onAnalysisSuccess,
  onAnalysisFail,
  setAnalyzeStep,
  isCanceledRef,
}: {
  onAnalysisStart: () => void;
  onAnalysisSuccess: (result: AnalysisResult) => void;
  onAnalysisFail: () => void;
  setAnalyzeStep: (step: number) => void;
  isCanceledRef: React.MutableRefObject<boolean>;
}) {
  const followingInputRef = useRef<HTMLInputElement | null>(null);
  const followersInputRef = useRef<HTMLInputElement | null>(null);

  const [followingFile, setFollowingFile] = useState<File | null>(null);
  const [followersFile, setFollowersFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const showError = (message: string) => {
    setErrorMessage(message);
  };

  const clearError = () => {
    setErrorMessage("");
  };

  const readFileText = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        resolve(String(reader.result ?? ""));
      };

      reader.onerror = () => {
        reject(new Error("파일을 읽는 중 오류가 발생했습니다."));
      };

      reader.readAsText(file);
    });
  };

  const validateFileName = (file: File, expectedNames: string[]) => {
    const fileName = file.name.toLowerCase();

    if (!fileName.endsWith(".js")) {
      showError("잘못된 파일입니다.");
      return false;
    }

    if (!expectedNames.includes(fileName)) {
      showError("잘못된 파일입니다.");
      return false;
    }

    return true;
  };

  const extractArchiveRows = (text: string) => {
    const startIndex = text.indexOf("[");
    const endIndex = text.lastIndexOf("]");

    if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
      throw new Error("JSON 배열을 찾을 수 없습니다.");
    }

    const jsonArrayText = text.slice(startIndex, endIndex + 1);
    const parsed: unknown = JSON.parse(jsonArrayText);

    if (!Array.isArray(parsed)) {
      throw new Error("올바른 관계 데이터 형식이 아닙니다.");
    }

    return parsed;
  };

  const validateArchiveFileContent = async (
    file: File,
    type: "following" | "followers",
  ) => {
    try {
      const text = await readFileText(file);

      if (!text.trim()) {
        showError("비어 있는 파일입니다.");
        return false;
      }

      const expectedKey = type === "following" ? "following" : "follower";
      const wrapperPattern =
        type === "following"
          ? /window\.YTD\.following\.part\d+\s*=/i
          : /window\.YTD\.follower\.part\d+\s*=/i;

      if (!wrapperPattern.test(text)) {
        showError(
          type === "following"
            ? "X 데이터 보관 파일의 following.js가 아닙니다."
            : "X 데이터 보관 파일의 followers.js가 아닙니다.",
        );
        return false;
      }

      const rows = extractArchiveRows(text);

      for (const row of rows) {
        if (typeof row !== "object" || row === null || Array.isArray(row)) {
          showError("관계 파일의 데이터 구조가 올바르지 않습니다.");
          return false;
        }

        const relation = (row as Record<string, unknown>)[expectedKey];

        if (
          typeof relation !== "object" ||
          relation === null ||
          Array.isArray(relation)
        ) {
          showError(
            type === "following"
              ? "following 관계 데이터 구조가 올바르지 않습니다."
              : "follower 관계 데이터 구조가 올바르지 않습니다.",
          );
          return false;
        }

        const accountId = (relation as Record<string, unknown>).accountId;

        if (typeof accountId !== "string" || !/^\d+$/.test(accountId.trim())) {
          showError("관계 파일에 올바른 accountId가 없습니다.");
          return false;
        }

        const userLink = (relation as Record<string, unknown>).userLink;

        if (
          userLink !== undefined &&
          (typeof userLink !== "string" || !userLink.trim())
        ) {
          showError("관계 파일의 userLink 형식이 올바르지 않습니다.");
          return false;
        }
      }

      return true;
    } catch {
      showError("파일 내용을 확인할 수 없습니다.");
      return false;
    }
  };

  const handleChangeFollowingFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    clearError();

    if (!validateFileName(file, ["following.js"])) {
      e.target.value = "";
      setFollowingFile(null);
      return;
    }

    setIsValidating(true);

    const isValidContent = await validateArchiveFileContent(file, "following");

    setIsValidating(false);

    if (!isValidContent) {
      e.target.value = "";
      setFollowingFile(null);
      return;
    }

    setFollowingFile(file);
    clearError();
    e.target.value = "";
  };

  const handleChangeFollowersFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    clearError();

    if (!validateFileName(file, ["followers.js", "follower.js"])) {
      e.target.value = "";
      setFollowersFile(null);
      return;
    }

    setIsValidating(true);

    const isValidContent = await validateArchiveFileContent(file, "followers");

    setIsValidating(false);

    if (!isValidContent) {
      e.target.value = "";
      setFollowersFile(null);
      return;
    }

    setFollowersFile(file);
    clearError();
    e.target.value = "";
  };

  const fetchAiReport = async (result: AnalysisResult) => {
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

    if (!response.ok) {
      throw new Error("AI 리포트 생성에 실패했습니다.");
    }

    const aiData: { report: string } = await response.json();

    return aiData.report;
  };

  const handleStartAnalyze = async () => {
    clearError();

    if (!followingFile || !followersFile) {
      showError("필수 파일 2개를 모두 선택해주세요.");
      return;
    }

    setIsValidating(true);
    onAnalysisStart();

    try {
      setAnalyzeStep(0);
      await sleep(600);

      if (isCanceledRef.current) {
        return;
      }

      const formData = new FormData();

      formData.append("followersFile", followersFile);
      formData.append("followingFile", followingFile);

      setAnalyzeStep(1);

      const response = await fetch("/api/analysis/upload", {
        method: "POST",
        body: formData,
      });

      const data: AnalysisResult = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "파일 업로드에 실패했습니다.");
      }

      if (isCanceledRef.current) {
        return;
      }

      setAnalyzeStep(2);
      await sleep(900);

      if (isCanceledRef.current) {
        return;
      }

      console.log("업로드 API 응답:", data);

      setAnalyzeStep(3);

      let aiReport = "";

      try {
        aiReport = await fetchAiReport(data);
      } catch (error) {
        console.error("AI 리포트 생성 실패:", error);
        aiReport = "";
      }

      if (isCanceledRef.current) {
        return;
      }

      setAnalyzeStep(4);
      await sleep(1000);

      if (isCanceledRef.current) {
        return;
      }

      setAnalyzeStep(5);
      await sleep(800);

      if (isCanceledRef.current) {
        return;
      }

      onAnalysisSuccess({
        ...data,
        aiReport,
      });
    } catch (error) {
      onAnalysisFail();

      if (error instanceof Error) {
        showError(error.message);
      } else {
        showError("파일 업로드 중 오류가 발생했습니다.");
      }
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-blue-200 bg-blue-50/30 px-8 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50 hover:shadow-inner">
        <div className="flex h-19 w-16 items-center justify-center rounded-full bg-blue-100 shadow-sm">
          <span className="text-3xl">📄</span>
        </div>

        <h3 className="mt-5 text-lg font-black tracking-[-0.03em]">
          관계 파일 업로드
        </h3>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          압축을 푼 데이터 보관 파일에서
          <br />
          필요한 관계 파일을 각각 선택하세요.
        </p>

        <div className="mt-5 grid w-full max-w-[320px] grid-cols-1 gap-3">
          <button
            type="button"
            onClick={() => followersInputRef.current?.click()}
            disabled={isValidating}
            className="rounded-2xl border border-blue-200 bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            {followersFile
              ? `${followersFile.name} 준비 완료`
              : "followers.js 선택"}
          </button>

          <button
            type="button"
            onClick={() => followingInputRef.current?.click()}
            disabled={isValidating}
            className="rounded-2xl border border-blue-200 bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            {followingFile
              ? `${followingFile.name} 준비 완료`
              : "following.js 선택"}
          </button>

          <button
            type="button"
            onClick={handleStartAnalyze}
            disabled={!followingFile || !followersFile || isValidating}
            className="mt-2 rounded-2xl bg-blue-600 px-7 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isValidating ? "분석 요청 중" : "분석 시작"}
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 w-full max-w-[320px] rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
            {errorMessage}
          </div>
        )}

        <input
          ref={followingInputRef}
          type="file"
          accept=".js"
          onChange={handleChangeFollowingFile}
          className="hidden"
        />

        <input
          ref={followersInputRef}
          type="file"
          accept=".js"
          onChange={handleChangeFollowersFile}
          className="hidden"
        />

        <p className="mt-5 text-xs text-slate-400">
          필수 파일: following.js, followers.js
        </p>
      </div>
    </section>
  );
}

function UsageCard() {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-black tracking-[-0.02em]">사용법</h3>

      <div className="mt-4 space-y-2.5 text-sm leading-6 text-slate-600">
        <CheckItem text="X(구 트위터) 설정에서 내 데이터 보관 파일을 다운로드합니다." />
        <CheckItem text="압축을 푼 뒤 following.js와 followers.js 파일만 선택합니다." />
        <CheckItem text="업로드 후 맞팔률과 비맞팔 기간 분포를 확인합니다." />
      </div>
    </section>
  );
}

function DataPolicyCard() {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-black tracking-[-0.02em]">
        데이터 처리 방식
      </h3>

      <div className="mt-4 space-y-2.5 text-sm leading-6 text-slate-600">
        <CheckItem text="맞팔 분석에 필요한 관계 파일만 사용합니다." />
        <CheckItem text="트윗, 좋아요, DM, 미디어 파일은 업로드하지 않습니다." />
        <CheckItem text="업로드한 원본 파일은 분석 완료 후 저장하지 않습니다." />
      </div>
    </section>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-[2px] shrink-0 text-violet-600">✔</span>
      <p>{text}</p>
    </div>
  );
}

export default UploadPage;
