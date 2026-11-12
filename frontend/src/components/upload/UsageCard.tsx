// 사용법 안내
import CheckItem from "./CheckItem";

function UsageCard() {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-black tracking-[-0.02em]">사용법</h3>

      <div className="mt-4 space-y-2.5 text-sm leading-6 text-slate-600">
        <CheckItem text="X(구 트위터) 설정에서 내 데이터 보관 파일을 다운로드합니다." />
        <CheckItem text="압축을 푼 뒤 following.js와 followers.js 파일만 선택합니다." />
        <CheckItem text="업로드 후 맞팔률과 비맞팔 기간 분포를 확인합니다." />
      </div>
    </section>
  );
}

export default UsageCard;
