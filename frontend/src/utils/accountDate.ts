// 계정 생성일 파싱, 계정 나이, X 프로필 링크 관련 함수
import type { AccountItem } from "../types/dashboard";

export function getAverageAgeMonths(accounts: AccountItem[]) {
  const ageMonthsList = accounts
    .map((account) => parseAccountCreatedDate(account.accountCreatedDate))
    .filter((date): date is Date => Boolean(date))
    .map((date) => getAgeInMonths(date));

  if (ageMonthsList.length === 0) {
    return null;
  }

  const totalMonths = ageMonthsList.reduce((sum, months) => sum + months, 0);

  return Math.round(totalMonths / ageMonthsList.length);
}

export function isLegacyAccount(account: AccountItem) {
  return account.isLegacyAccount === true || account.isLegacyAccount === "true";
}

export function createAccountRowCreatedLabel(account: AccountItem) {
  if (isLegacyAccount(account)) {
    return "2010년 이전 계정";
  }

  const date = parseAccountCreatedDate(account.accountCreatedDate);

  if (!date || date.getFullYear() <= 2010) {
    return "2010년 이전 계정";
  }

  return `가입일 ${formatDateLabel(date)}`;
}

function formatDateLabel(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}.${month}.${day}`;
}

export function createXProfileUrl(account: AccountItem) {
  if (account.accountId) {
    return `https://x.com/i/user/${account.accountId}`;
  }

  if (account.userLink) {
    return account.userLink;
  }

  return null;
}

export function getAccountCreatedPeriodLabel(account: AccountItem) {
  if (isLegacyAccount(account)) {
    return "2010년 이전";
  }

  const date = parseAccountCreatedDate(account.accountCreatedDate);

  if (!date) {
    return null;
  }

  const year = date.getFullYear();

  if (year <= 2010) {
    return "2010년 이전";
  }

  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}.${month}`;
}

export function getPeriodSortValue(label: string) {
  if (label === "2010년 이전") {
    return 201000;
  }

  const match = label.match(/^(\d{4})\.(\d{2})$/);

  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  return Number(match[1]) * 100 + Number(match[2]);
}

export function parseAccountCreatedDate(dateText?: string) {
  if (!dateText) {
    return null;
  }

  const normalized = dateText.trim();

  const dotMatch = normalized.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/);
  if (dotMatch) {
    return new Date(
      Number(dotMatch[1]),
      Number(dotMatch[2]) - 1,
      Number(dotMatch[3]),
    );
  }

  const dashMatch = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (dashMatch) {
    return new Date(
      Number(dashMatch[1]),
      Number(dashMatch[2]) - 1,
      Number(dashMatch[3]),
    );
  }

  const parsedDate = new Date(normalized);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

export function getAgeInMonths(date: Date) {
  const now = new Date();

  const months =
    (now.getFullYear() - date.getFullYear()) * 12 +
    (now.getMonth() - date.getMonth());

  return Math.max(months, 0);
}

export function formatAgeByMonths(totalMonths: number) {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (years <= 0) {
    return `${months}개월`;
  }

  if (months <= 0) {
    return `${years}년`;
  }

  return `${years}년 ${months}개월`;
}
