// 	데이터 처리 방식 안내
import CheckItem from "./CheckItem";

function DataPolicyCard() {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-black tracking-[-0.02em]">
        데이터 처리 방식
      </h3>

      <div className="mt-4 space-y-2.5 text-sm leading-6 text-slate-600">
        <CheckItem text="맞팔 분석에 필요한 관계 파일만 사용합니다." />
        <CheckItem text="트윗, 좋아요, DM, 미디어 파일은 업로드하지 않습니다." />
        <CheckItem text="업로드한 원본 파일은 분석 완료 후 저장하지 않습니다." />
      </div>
    </section>
  );
}

export default DataPolicyCard;
