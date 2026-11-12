// 관리자 월별/연도별 조회 선택 영역 UI
import type { ReactNode } from "react";

function PeriodSelector({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-black text-slate-800">{title}</p>
      </div>

      <div className="flex items-center">{children}</div>
    </div>
  );
}

export default PeriodSelector;
