// 계정 수를 K/M 단위로 축약하는 숫자 포맷 함수
export function formatCount(value: number) {
  if (value >= 1000000) {
    return `${Math.round(value / 100000) / 10}M`;
  }

  if (value >= 1000) {
    return `${Math.round(value / 100) / 10}K`;
  }

  return value.toLocaleString();
}
