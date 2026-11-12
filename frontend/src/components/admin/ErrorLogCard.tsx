// 관리자 최근 오류 5건 목록 UI
import type { ErrorLog } from "../../types/admin";

function ErrorLogCard({
  errorLogs,
  loading,
  error,
}: {
  errorLogs: ErrorLog[];
  loading: boolean;
  error: string;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black">최근 오류</h3>

          <p className="mt-1 text-xs font-semibold text-slate-400">
            최근 발생한 분석 및 AI 오류
          </p>
        </div>

        <p className="text-xs font-bold text-slate-400">최근 5건</p>
      </div>

      {loading ? (
        <div className="flex min-h-[110px] items-center justify-center">
          <p className="text-xs font-semibold text-slate-400">
            오류 데이터를 불러오는 중입니다.
          </p>
        </div>
      ) : error ? (
        <div className="flex min-h-[110px] items-center justify-center">
          <p className="text-xs font-bold text-red-500">{error}</p>
        </div>
      ) : errorLogs.length === 0 ? (
        <div className="flex min-h-[110px] items-center justify-center">
          <p className="text-xs font-semibold text-slate-400">
            최근 발생한 오류가 없습니다.
          </p>
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
          <div className="grid grid-cols-[140px_100px_1fr] bg-slate-50 px-4 py-3">
            <p className="text-xs font-black text-slate-500">발생 시간</p>
            <p className="text-xs font-black text-slate-500">구분</p>
            <p className="text-xs font-black text-slate-500">오류 내용</p>
          </div>

          {errorLogs.slice(0, 5).map((log, index) => (
            <div
              key={`${log.occurredAt}-${index}`}
              className="grid grid-cols-[140px_100px_1fr] border-t border-slate-100 px-4 py-3"
            >
              <p className="text-xs font-semibold text-slate-600">
                {log.occurredAt}
              </p>

              <p className="text-xs font-black text-slate-700">
                {log.type === "ANALYSIS" ? "분석" : "AI"}
              </p>

              <p className="text-xs font-semibold text-slate-600">
                {log.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default ErrorLogCard;
