import { useRef, useState } from "react";
import type { AnalysisResult } from "../App";
import AnalyzeModal from "./AnalyzeModal";

function UploadPage({
  onAnalysisComplete,
}: {
  onAnalysisComplete: (result: AnalysisResult) => void;
}) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null,
  );

  const handleCancelAnalyze = () => {
    setIsAnalyzing(false);
    setAnalysisResult(null);
  };

  const handleAnalysisComplete = () => {
    if (!analysisResult) {
      setIsAnalyzing(false);
      return;
    }

    setIsAnalyzing(false);
    onAnalysisComplete(analysisResult);
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-slate-950">
      {isAnalyzing && (
        <AnalyzeModal
          onCancel={handleCancelAnalyze}
          onComplete={handleAnalysisComplete}
        />
      )}

      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <img
              src="/main_1.png"
              alt="MutualCheck logo"
              className="h-8 w-8 object-contain"
            />

            <h1 className="text-xl font-black tracking-[-0.03em]">
              MutualCheck
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-5 py-8">
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[600px_420px] lg:items-start lg:justify-center">
          <div>
            <div className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
              X(구 트위터) 맞팔 관계 분석 도구
            </div>

            <h1 className="mt-6 text-4xl font-black leading-[1.12] tracking-[-0.055em] text-slate-950 lg:text-5xl">
              맞팔 상태를 확인하고
              <br />
              AI 추천 결과를 살펴보세요.
            </h1>

            <p className="mt-5 max-w-[560px] text-base leading-7 text-slate-600">
              파일을 기반으로 맞팔률과 비맞팔 기간 분포를 확인할 수 있습니다.
            </p>

            <div className="mt-8 max-w-[560px] space-y-4">
              <UsageCard />
              <DataPolicyCard />
            </div>
          </div>

          <div className="lg:pt-[75px]">
            <UploadCard
              onAnalysisStart={() => setIsAnalyzing(true)}
              onAnalysisSuccess={(result) => setAnalysisResult(result)}
              onAnalysisFail={() => {
                setIsAnalyzing(false);
                setAnalysisResult(null);
              }}
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
}: {
  onAnalysisStart: () => void;
  onAnalysisSuccess: (result: AnalysisResult) => void;
  onAnalysisFail: () => void;
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

  const validateArchiveFileContent = async (
    file: File,
    type: "following" | "followers",
  ) => {
    try {
      const text = await readFileText(file);
      const lowerText = text.toLowerCase();

      if (!lowerText.includes("accountid")) {
        showError("잘못된 파일입니다.");
        return false;
      }

      if (type === "following") {
        const hasFollowingStructure =
          lowerText.includes("window.ytd.following") ||
          lowerText.includes('"following"') ||
          lowerText.includes("followingaccountid");

        if (!hasFollowingStructure) {
          showError("잘못된 파일입니다.");
          return false;
        }
      }

      if (type === "followers") {
        const hasFollowerStructure =
          lowerText.includes("window.ytd.follower") ||
          lowerText.includes('"follower"') ||
          lowerText.includes("followeraccountid");

        if (!hasFollowerStructure) {
          showError("잘못된 파일입니다.");
          return false;
        }
      }

      return true;
    } catch {
      showError("파일을 확인할 수 없습니다.");
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

  const handleStartAnalyze = async () => {
    clearError();

    if (!followingFile || !followersFile) {
      showError("필수 파일 2개를 모두 선택해주세요.");
      return;
    }

    setIsValidating(true);
    onAnalysisStart();

    try {
      const formData = new FormData();

      formData.append("followersFile", followersFile);
      formData.append("followingFile", followingFile);

      const response = await fetch("/api/analysis/upload", {
        method: "POST",
        body: formData,
      });

      const data: AnalysisResult = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "파일 업로드에 실패했습니다.");
      }

      console.log("업로드 API 응답:", data);

      onAnalysisSuccess(data);
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
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
      <div className="flex min-h-[500px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-blue-200 bg-blue-50/30 px-8 py-10 text-center transition hover:border-blue-400 hover:bg-blue-50 hover:shadow-inner">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 shadow-sm">
          <span className="text-3xl">📄</span>
        </div>

        <h3 className="mt-7 text-lg font-black tracking-[-0.03em]">
          관계 파일 업로드
        </h3>

        <p className="mt-4 text-sm leading-6 text-slate-500">
          압축을 푼 데이터 보관 파일에서
          <br />
          필요한 관계 파일을 각각 선택하세요.
        </p>

        <div className="mt-7 grid w-full max-w-[320px] grid-cols-1 gap-3">
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
