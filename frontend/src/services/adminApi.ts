// 관리자 통계·오류 로그 API 호출
import type { ErrorLog, MonthlyData, SummaryData, YearlyData } from "../types/admin";

const API_BASE_URL = "http://localhost:8080";

async function requestAdminData<T>(
  path: string,
  errorPrefix: string,
  signal: AbortSignal,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { signal });

  if (!response.ok) {
    throw new Error(`${errorPrefix}: HTTP ${response.status}`);
  }

  return (await response.json()) as T;
}

export function fetchAdminSummary(signal: AbortSignal): Promise<SummaryData> {
  return requestAdminData<SummaryData>(
    "/api/admin/summary",
    "관리자 요약 통계 조회 실패",
    signal,
  );
}

export function fetchAdminMonthly(
  month: string,
  signal: AbortSignal,
): Promise<MonthlyData> {
  return requestAdminData<MonthlyData>(
    `/api/admin/monthly?month=${month}`,
    "월별 관리자 통계 조회 실패",
    signal,
  );
}

export function fetchAdminYearly(
  year: number,
  signal: AbortSignal,
): Promise<YearlyData> {
  return requestAdminData<YearlyData>(
    `/api/admin/yearly?year=${year}`,
    "연간 관리자 통계 조회 실패",
    signal,
  );
}

export function fetchAdminErrorLogs(signal: AbortSignal): Promise<ErrorLog[]> {
  return requestAdminData<ErrorLog[]>(
    "/api/admin/errors",
    "최근 오류 조회 실패",
    signal,
  );
}
