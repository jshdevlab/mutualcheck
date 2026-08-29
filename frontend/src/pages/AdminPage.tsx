import { useState } from "react";

type UsageData = {
  date: string;
  count: number;
};

type ErrorLog = {
  occurredAt: string;
  type: "ANALYSIS" | "AI";
  message: string;
};

const START_YEAR = 2026;

const createMonthDays = (year: number, month: number): UsageData[] => {
  const result: UsageData[] = [];
  const lastDay = new Date(year, month, 0).getDate();

  for (let day = 1; day <= lastDay; day += 1) {
    result.push({
      date: `${String(month).padStart(2, "0")}.${String(day).padStart(2, "0")}`,
      count: 0,
    });
  }

  return result;
};

const createYearMonths = (): UsageData[] => {
  const result: UsageData[] = [];

  for (let month = 1; month <= 12; month += 1) {
    result.push({
      date: String(month).padStart(2, "0"),
      count: 0,
    });
  }

  return result;
};

function AdminPage() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const [selectedMonth, setSelectedMonth] = useState(
    `${currentYear}-${String(currentMonth).padStart(2, "0")}`,
  );
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const [selectedMonthYearText, selectedMonthText] = selectedMonth.split("-");
  const selectedMonthYear = Number(selectedMonthYearText);
  const selectedMonthNumber = Number(selectedMonthText);

  const analysisMonthTrend = createMonthDays(
    selectedMonthYear,
    selectedMonthNumber,
  );
  const aiMonthTrend = createMonthDays(selectedMonthYear, selectedMonthNumber);

  const analysisYearTrend = createYearMonths();
  const aiYearTrend = createYearMonths();

  const yearOptions = Array.from(
    { length: Math.max(currentYear - START_YEAR + 1, 1) },
    (_, index) => currentYear - index,
  );

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1000px] items-center justify-between px-4 py-1">
          <div className="flex items-center gap-2">
            <img
              src="/main_1.png"
              alt="MutualCheck logo"
              className="h-6 w-6 object-contain"
            />

            <h1 className="text-base font-black tracking-[-0.03em]">
              MutualCheck Admin
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1000px] space-y-4 p-4">
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminMetricCard title="오늘 분석" value="0회" />
          <AdminMetricCard title="이번 달 분석" value="0회" />
          <AdminMetricCard title="오늘 AI 호출" value="0 / 300" />
          <AdminMetricCard title="이번 달 AI 호출" value="0 / 5,000" />
        </section>

        <section>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatusItem label="AI 성공" value="0회" />
            <StatusItem label="AI 실패" value="0회" />
            <StatusItem label="한도 차단" value="0회" />
            <StatusItem label="이번 달 AI 비용" value="$0.00" />
          </div>
        </section>

        <section className="space-y-3">
          <PeriodSelector title="월별 상세 조회">
            <div className="flex items-center gap-2">
              <select
                value={selectedMonthYear}
                onChange={(event) => {
                  const nextYear = Number(event.target.value);

                  let nextMonth = selectedMonthNumber;

                  if (nextYear === currentYear && nextMonth > currentMonth) {
                    nextMonth = currentMonth;
                  }

                  setSelectedMonth(
                    `${nextYear}-${String(nextMonth).padStart(2, "0")}`,
                  );
                }}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                aria-label="조회할 연도 선택"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}년
                  </option>
                ))}
              </select>

              <select
                value={selectedMonthNumber}
                onChange={(event) => {
                  const nextMonth = Number(event.target.value);

                  setSelectedMonth(
                    `${selectedMonthYear}-${String(nextMonth).padStart(2, "0")}`,
                  );
                }}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                aria-label="조회할 월 선택"
              >
                {Array.from({ length: 12 }, (_, index) => index + 1).map(
                  (month) => {
                    const isFutureMonth =
                      selectedMonthYear === currentYear && month > currentMonth;

                    return (
                      <option
                        key={month}
                        value={month}
                        disabled={isFutureMonth}
                      >
                        {String(month).padStart(2, "0")}월
                      </option>
                    );
                  },
                )}
              </select>
            </div>
          </PeriodSelector>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TrendCard
              title={`${selectedMonthYear}년 ${selectedMonthNumber}월 분석 추이`}
              description="일별 분석 실행 횟수"
              data={analysisMonthTrend}
              totalLabel={`${selectedMonthNumber}월 합계`}
            />

            <TrendCard
              title={`${selectedMonthYear}년 ${selectedMonthNumber}월 AI 호출 추이`}
              description="일별 OpenAI 호출 횟수"
              data={aiMonthTrend}
              totalLabel={`${selectedMonthNumber}월 합계`}
            />
          </div>
        </section>

        <section className="space-y-3">
          <PeriodSelector title="연간 조회">
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
              className="h-9 min-w-[120px] rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              aria-label="조회할 연도 선택"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}년
                </option>
              ))}
            </select>
          </PeriodSelector>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TrendCard
              title={`${selectedYear}년 분석 추이`}
              description="월별 분석 실행 횟수"
              data={analysisYearTrend}
              totalLabel={`${selectedYear}년 합계`}
              showAllLabels
            />

            <TrendCard
              title={`${selectedYear}년 AI 호출 추이`}
              description="월별 OpenAI 호출 횟수"
              data={aiYearTrend}
              totalLabel={`${selectedYear}년 합계`}
              showAllLabels
            />
          </div>
        </section>

        <section>
          <ErrorLogCard />
        </section>
      </main>
    </div>
  );
}

function PeriodSelector({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
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

function AdminMetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black text-slate-600">{title}</p>

      <h3 className="mt-3 text-2xl font-black tracking-[-0.03em]">{value}</h3>
    </div>
  );
}

function TrendCard({
  title,
  description,
  data,
  totalLabel,
  showAllLabels = false,
}: {
  title: string;
  description: string;
  data: UsageData[];
  totalLabel: string;
  showAllLabels?: boolean;
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

          <p className="mt-1 text-lg font-black">{total.toLocaleString()}회</p>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border border-slate-100 bg-slate-50/50">
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
              <text x={paddingLeft} y={height - 8} fontSize="11" fill="#94A3B8">
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
      </div>

      {total === 0 && (
        <p className="mt-3 text-center text-xs font-semibold text-slate-400">
          아직 집계된 데이터가 없습니다.
        </p>
      )}
    </section>
  );
}

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black text-slate-600">{label}</p>

      <h3 className="mt-3 text-2xl font-black tracking-[-0.03em]">{value}</h3>
    </div>
  );
}

function ErrorLogCard() {
  const errorLogs: ErrorLog[] = [];

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

      {errorLogs.length === 0 ? (
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

export default AdminPage;
