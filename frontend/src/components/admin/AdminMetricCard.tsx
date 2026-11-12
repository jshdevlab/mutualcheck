// 분석 횟수와 AI 호출 횟수 표시 카드
function AdminMetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black text-slate-600">{title}</p>

      <h3 className="mt-3 text-2xl font-black tracking-[-0.03em]">{value}</h3>
    </div>
  );
}

export default AdminMetricCard;
