import { useEffect, useState } from "react";

function AnalyzeModal({
  onCancel,
  onComplete,
}: {
  onCancel: () => void;
  onComplete: () => void;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 700),
      setTimeout(() => setStep(2), 1400),
      setTimeout(() => setStep(3), 2100),
      setTimeout(() => setStep(4), 2800),
      setTimeout(() => setStep(5), 3500),
      setTimeout(() => onComplete(), 4000),
    ];

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-5 backdrop-blur-sm">
      <section className="relative w-full max-w-[500px] rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-2xl font-light text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="분석 취소"
        >
          ×
        </button>

        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-violet-100">
          {step < 5 && (
            <div className="absolute inset-0 rounded-full border-4 border-violet-200 border-t-violet-500 animate-spin" />
          )}

          <span className="relative text-4xl">{step >= 5 ? "✅" : "🔍"}</span>
        </div>

        <h2 className="mt-6 text-center text-[25px] font-extrabold leading-[1.25] tracking-[-0.02em] text-slate-950">
          {step >= 5 ? "분석이 완료되었습니다" : "데이터를 분석하는 중입니다"}
        </h2>

        <p className="mt-2 text-center text-sm text-slate-500">
          {step >= 5 ? "결과 화면으로 이동합니다." : "잠시만 기다려 주세요."}
        </p>

        <div className="mt-8 space-y-5">
          <AnalyzeStep
            active={step > 0}
            current={step === 0}
            title="관계 파일 업로드 완료"
            desc="following.js와 followers.js 파일을 확인했습니다."
          />

          <AnalyzeStep
            active={step > 1}
            current={step === 1}
            title="데이터 구조 확인 중"
            desc="X 데이터 보관 파일의 관계 데이터를 확인하고 있습니다."
          />

          <AnalyzeStep
            active={step > 2}
            current={step === 2}
            title="팔로잉/팔로워 목록 분석 중"
            desc="accountId 기준으로 팔로잉과 팔로워 목록을 정리하고 있습니다."
          />

          <AnalyzeStep
            active={step > 3}
            current={step === 3}
            title="맞팔 관계 계산 중"
            desc="맞팔 계정과 비맞팔 계정을 계산하고 있습니다."
          />

          <AnalyzeStep
            active={step > 4}
            current={step === 4}
            title="대시보드 생성 중"
            desc="맞팔률과 분석 결과를 화면에 표시할 수 있도록 정리하고 있습니다."
          />
        </div>
      </section>
    </div>
  );
}

function AnalyzeStep({
  title,
  desc,
  active = false,
  current = false,
}: {
  title: string;
  desc: string;
  active?: boolean;
  current?: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-black ${
            current || active
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-slate-300 bg-white text-slate-400"
          }`}
        >
          {active ? "✓" : current ? "•" : ""}
        </div>

        <div className="mt-1 h-full w-[2px] bg-slate-200" />
      </div>

      <div className="pb-5">
        <h3
          className={`text-sm font-black ${
            current || active ? "text-slate-950" : "text-slate-400"
          }`}
        >
          {title}
        </h3>

        <p
          className={`mt-1 text-xs leading-5 ${
            current || active ? "text-slate-500" : "text-slate-400"
          }`}
        >
          {desc}
        </p>
      </div>
    </div>
  );
}

export default AnalyzeModal;
