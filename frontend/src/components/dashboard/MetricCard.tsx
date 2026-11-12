// 팔로워·팔로잉·맞팔·비맞팔 수치를 표시하는 개별 카드
export default function MetricCard({
  title,
  value,
  desc,
  icon,
  tone,
}: {
  title: string;
  value: string;
  desc: string;
  icon: string;
  tone: "blue" | "red" | "green" | "purple";
}) {
  const toneClass = {
    blue: "bg-blue-50",
    red: "bg-red-50",
    green: "bg-emerald-50",
    purple: "bg-violet-50",
  }[tone];

  return (
    <div className="min-h-[118px] rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
      <div className="flex justify-center">
        <div
          className={`mt-2 flex h-9 w-9 items-center justify-center rounded-full ${toneClass}`}
        >
          <img src={icon} alt={title} className="h-6 w-6 object-contain" />
        </div>
      </div>

      <p className="mt-2 text-xs font-black text-slate-700">{title}</p>
      <h3 className="mt-2 text-xl font-black tracking-[-0.01em]">{value}</h3>
      <p className="mt-1.5 text-[11px] font-bold text-slate-500">{desc}</p>
    </div>
  );
}
