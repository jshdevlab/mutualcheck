// 맞팔 및 비맞팔 개수를 나타내는 수직 막대 UI
import { formatCount } from "../../utils/format";

export default function ChartBar({
  count,

  height,
  colorClass,
}: {
  count: number;

  height: number;
  colorClass: string;
}) {
  return (
    <div className="flex w-[42px] flex-col items-center">
      <div className="mb-2 text-center text-[11px] font-black leading-4 text-slate-700">
        <p>{formatCount(count)}</p>
      </div>

      <div
        className={`w-full rounded-t-md shadow-sm ${colorClass}`}
        style={{
          height: `${Math.max(height, count > 0 ? 8 : 0)}px`,
        }}
      />
    </div>
  );
}
