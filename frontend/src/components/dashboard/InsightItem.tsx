// AI 핵심 인사이트 항목 한 줄 표시
export default function InsightItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 font-black text-blue-600">✓</span>
      <span>{text}</span>
    </li>
  );
}
