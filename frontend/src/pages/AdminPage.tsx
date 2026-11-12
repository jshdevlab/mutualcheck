// 관리자 페이지: 조회 기간 상태 관리 및 관리자 화면 구성
import { useEffect, useState } from "react";
import AdminSummary from "../components/admin/AdminSummary";
import ErrorLogCard from "../components/admin/ErrorLogCard";
import PeriodSelector from "../components/admin/PeriodSelector";
import TrendCard from "../components/admin/TrendCard";
import {
  fetchAdminErrorLogs,
  fetchAdminMonthly,
  fetchAdminSummary,
  fetchAdminYearly,
} from "../services/adminApi";
import type { ErrorLog, MonthlyData, SummaryData, YearlyData } from "../types/admin";

const START_YEAR = 2026;

function AdminPage() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const [selectedMonth, setSelectedMonth] = useState(
    `${currentYear}-${String(currentMonth).padStart(2, "0")}`,
  );

  const [selectedYear, setSelectedYear] = useState(currentYear);

  const [summary, setSummary] = useState<SummaryData | null>(null);

  const [monthlyData, setMonthlyData] = useState<MonthlyData>({
    analysisTrend: [],
    aiTrend: [],
  });

  const [yearlyData, setYearlyData] = useState<YearlyData>({
    analysisTrend: [],
    aiTrend: [],
  });

  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);

  const [summaryLoading, setSummaryLoading] = useState(true);
  const [monthlyLoading, setMonthlyLoading] = useState(true);
  const [yearlyLoading, setYearlyLoading] = useState(true);
  const [errorLogsLoading, setErrorLogsLoading] = useState(true);

  const [summaryError, setSummaryError] = useState("");
  const [monthlyError, setMonthlyError] = useState("");
  const [yearlyError, setYearlyError] = useState("");
  const [errorLogsError, setErrorLogsError] = useState("");

  const [selectedMonthYearText, selectedMonthText] = selectedMonth.split("-");

  const selectedMonthYear = Number(selectedMonthYearText);
  const selectedMonthNumber = Number(selectedMonthText);

  const yearOptions = Array.from(
    { length: Math.max(currentYear - START_YEAR + 1, 1) },
    (_, index) => currentYear - index,
  );

  useEffect(() => {
    const controller = new AbortController();

    const fetchSummary = async () => {
      setSummaryLoading(true);
      setSummaryError("");

      try {
        const data: SummaryData = await fetchAdminSummary(controller.signal);

        setSummary(data);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("관리자 요약 통계 조회 실패:", error);

        setSummaryError("관리자 요약 데이터를 불러오지 못했습니다.");
      } finally {
        if (!controller.signal.aborted) {
          setSummaryLoading(false);
        }
      }
    };

    fetchSummary();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchMonthlyData = async () => {
      setMonthlyLoading(true);
      setMonthlyError("");

      try {
        const data: MonthlyData = await fetchAdminMonthly(selectedMonth, controller.signal);

        setMonthlyData(data);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("월별 관리자 통계 조회 실패:", error);

        setMonthlyError("월별 통계 데이터를 불러오지 못했습니다.");
      } finally {
        if (!controller.signal.aborted) {
          setMonthlyLoading(false);
        }
      }
    };

    fetchMonthlyData();

    return () => {
      controller.abort();
    };
  }, [selectedMonth]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchYearlyData = async () => {
      setYearlyLoading(true);
      setYearlyError("");

      try {
        const data: YearlyData = await fetchAdminYearly(selectedYear, controller.signal);

        setYearlyData(data);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("연간 관리자 통계 조회 실패:", error);

        setYearlyError("연간 통계 데이터를 불러오지 못했습니다.");
      } finally {
        if (!controller.signal.aborted) {
          setYearlyLoading(false);
        }
      }
    };

    fetchYearlyData();

    return () => {
      controller.abort();
    };
  }, [selectedYear]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchErrorLogs = async () => {
      setErrorLogsLoading(true);
      setErrorLogsError("");

      try {
        const data: ErrorLog[] = await fetchAdminErrorLogs(controller.signal);

        setErrorLogs(data);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("최근 오류 조회 실패:", error);

        setErrorLogsError("최근 오류 데이터를 불러오지 못했습니다.");
      } finally {
        if (!controller.signal.aborted) {
          setErrorLogsLoading(false);
        }
      }
    };

    fetchErrorLogs();

    return () => {
      controller.abort();
    };
  }, []);

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
        {summaryError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-bold text-red-600">{summaryError}</p>
          </div>
        )}

        <AdminSummary summary={summary} loading={summaryLoading} />

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

          {monthlyError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-bold text-red-600">{monthlyError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TrendCard
              title={`${selectedMonthYear}년 ${selectedMonthNumber}월 분석 추이`}
              description="일별 분석 실행 횟수"
              data={monthlyData.analysisTrend}
              totalLabel={`${selectedMonthNumber}월 합계`}
              loading={monthlyLoading}
            />

            <TrendCard
              title={`${selectedMonthYear}년 ${selectedMonthNumber}월 AI 호출 추이`}
              description="일별 OpenAI 호출 횟수"
              data={monthlyData.aiTrend}
              totalLabel={`${selectedMonthNumber}월 합계`}
              loading={monthlyLoading}
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

          {yearlyError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-bold text-red-600">{yearlyError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TrendCard
              title={`${selectedYear}년 분석 추이`}
              description="월별 분석 실행 횟수"
              data={yearlyData.analysisTrend}
              totalLabel={`${selectedYear}년 합계`}
              showAllLabels
              loading={yearlyLoading}
            />

            <TrendCard
              title={`${selectedYear}년 AI 호출 추이`}
              description="월별 OpenAI 호출 횟수"
              data={yearlyData.aiTrend}
              totalLabel={`${selectedYear}년 합계`}
              showAllLabels
              loading={yearlyLoading}
            />
          </div>
        </section>

        <section>
          <ErrorLogCard
            errorLogs={errorLogs}
            loading={errorLogsLoading}
            error={errorLogsError}
          />
        </section>
      </main>
    </div>
  );
}

export default AdminPage;
