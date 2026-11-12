// 안내 문구 공통 UI
function CheckItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-[2px] shrink-0 text-violet-600">✔</span>

      <p>{text}</p>
    </div>
  );
}

export default CheckItem;
