// 관리자 일별/월별 추이 SVG 차트
import type { UsageData } from "../../types/admin";

function TrendCard({
  title,
  description,
  data,
  totalLabel,
  showAllLabels = false,
  loading = false,
}: {
  title: string;
  description: string;
  data: UsageData[];
  totalLabel: string;
  showAllLabels?: boolean;
  loading?: boolean;
}) {
  const maxCount = Math.max(...data.map((item) => item.count), 1);

  const width = 600;
  const height = 190;

  const paddingLeft = 34;
  const paddingRight = 12;
  const paddingTop = 16;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const points = data.map((item, index) => {
    const x = paddingLeft + (index / Math.max(data.length - 1, 1)) * chartWidth;

    const y = paddingTop + chartHeight - (item.count / maxCount) * chartHeight;

    return {
      ...item,
      x,
      y,
    };
  });

  const pointString = points.map((point) => `${point.x},${point.y}`).join(" ");

  const total = data.reduce((sum, item) => sum + item.count, 0);

  const middleIndex = Math.floor(data.length / 2);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-black">{title}</h3>

          <p className="mt-1 text-xs font-semibold text-slate-400">
            {description}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs font-bold text-slate-400">{totalLabel}</p>

          <p className="mt-1 text-lg font-black">
            {loading ? "-" : `${total.toLocaleString()}회`}
          </p>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border border-slate-100 bg-slate-50/50">
        {loading ? (
          <div className="flex h-[190px] items-center justify-center">
            <p className="text-xs font-semibold text-slate-400">
              데이터를 불러오는 중입니다.
            </p>
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-[190px] w-full"
            role="img"
            aria-label={title}
          >
            <line
              x1={paddingLeft}
              y1={paddingTop}
              x2={paddingLeft}
              y2={paddingTop + chartHeight}
              stroke="#E2E8F0"
              strokeWidth="1"
            />

            <line
              x1={paddingLeft}
              y1={paddingTop + chartHeight}
              x2={width - paddingRight}
              y2={paddingTop + chartHeight}
              stroke="#E2E8F0"
              strokeWidth="1"
            />

            <line
              x1={paddingLeft}
              y1={paddingTop + chartHeight / 2}
              x2={width - paddingRight}
              y2={paddingTop + chartHeight / 2}
              stroke="#E2E8F0"
              strokeWidth="1"
              strokeDasharray="4 4"
            />

            <polyline
              points={pointString}
              fill="none"
              stroke="#2563EB"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {points.map((point, index) => (
              <circle
                key={`${point.date}-${index}`}
                cx={point.x}
                cy={point.y}
                r="3"
                fill="#2563EB"
              />
            ))}

            {showAllLabels ? (
              points.map((point, index) => (
                <text
                  key={`label-${point.date}-${index}`}
                  x={point.x}
                  y={height - 8}
                  fontSize="10"
                  fill="#94A3B8"
                  textAnchor="middle"
                >
                  {point.date}
                </text>
              ))
            ) : (
              <>
                <text
                  x={paddingLeft}
                  y={height - 8}
                  fontSize="11"
                  fill="#94A3B8"
                >
                  {data[0]?.date}
                </text>

                <text
                  x={width / 2}
                  y={height - 8}
                  fontSize="11"
                  fill="#94A3B8"
                  textAnchor="middle"
                >
                  {data[middleIndex]?.date}
                </text>

                <text
                  x={width - paddingRight}
                  y={height - 8}
                  fontSize="11"
                  fill="#94A3B8"
                  textAnchor="end"
                >
                  {data[data.length - 1]?.date}
                </text>
              </>
            )}
          </svg>
        )}
      </div>

      {!loading && total === 0 && (
        <p className="mt-3 text-center text-xs font-semibold text-slate-400">
          아직 집계된 데이터가 없습니다.
        </p>
      )}
    </section>
  );
}

export default TrendCard;
