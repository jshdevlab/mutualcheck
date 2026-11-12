// 파일 선택, 분석 진행 상태 관리
import { useRef, useState } from "react";
import type { ChangeEvent, MutableRefObject } from "react";
import type { AnalysisResult } from "../../App";
import { uploadAnalysisFiles } from "../../services/analysisApi";
import { AiReportLimitError, fetchAiReport } from "../../services/aiReportApi";
import {
  validateArchiveFileContent,
  validateFileName,
} from "../../utils/archiveValidator";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  isCanceledRef: MutableRefObject<boolean>;
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

  const handleChangeFollowingFile = async (
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    clearError();

    if (!validateFileName(file, ["following.js"], showError)) {
      e.target.value = "";
      setFollowingFile(null);
      return;
    }

    setIsValidating(true);

    const isValidContent = await validateArchiveFileContent(
      file,
      "following",
      showError,
    );

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
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    clearError();

    if (!validateFileName(file, ["followers.js", "follower.js"], showError)) {
      e.target.value = "";
      setFollowersFile(null);
      return;
    }

    setIsValidating(true);

    const isValidContent = await validateArchiveFileContent(
      file,
      "followers",
      showError,
    );

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
      setAnalyzeStep(0);
      await sleep(600);

      if (isCanceledRef.current) {
        return;
      }

      setAnalyzeStep(1);

      const data = await uploadAnalysisFiles(followersFile, followingFile);

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
        if (error instanceof AiReportLimitError) {
          throw error;
        }

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

export default UploadCard;
