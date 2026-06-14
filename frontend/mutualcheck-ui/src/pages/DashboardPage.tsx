const recommendedCandidates = [
  {
    rank: 1,
    days: 1450,
    followStartDate: "2020.10.01",
  },
  {
    rank: 2,
    days: 1210,
    followStartDate: "2021.05.18",
  },
  {
    rank: 3,
    days: 1090,
    followStartDate: "2021.07.30",
  },
  {
    rank: 4,
    days: 980,
    followStartDate: "2021.09.22",
  },
  {
    rank: 5,
    days: 910,
    followStartDate: "2021.10.15",
  },
];

const periodDistribution = [
  { label: "30일 이하", count: 512, rate: "1.9%" },
  { label: "1 ~ 6개월", count: 1842, rate: "6.7%" },
  { label: "6 ~ 12개월", count: 2958, rate: "10.7%" },
  { label: "1 ~ 3년", count: 6894, rate: "25.0%" },
  { label: "3 ~ 5년", count: 4798, rate: "17.4%" },
  { label: "5년 이상", count: 4798, rate: "17.4%" },
];

export default function DashboardPage() {
  const maxCount = Math.max(...periodDistribution.map((item) => item.count));

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1000px] items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <img
              src="/main_1.png"
              alt="MutualCheck logo"
              className="h-6 w-6 object-contain"
            />
            <h1 className="text-base font-black tracking-[-0.03em]">
              MutualCheck
            </h1>
          </div>

          <p className="text-xs font-semibold text-slate-700">
            마지막 분석: 2024.10.20 14:30
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1000px] space-y-3 p-3">
        <section className="grid grid-cols-1 gap-3 md:grid-cols-20 xl:grid-cols-6">
          <div className="min-h-[132px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2">
            <p className="ml-4 text-xs font-bold text-slate-700">
              맞팔률{" "}
              <span className="font-semibold text-slate-500">
                (Mutual Follow Rate)
              </span>
            </p>

            <div className="mt-4 flex items-center justify-between">
              <div className="ml-3">
                <h2 className="text-4xl font-black tracking-[-0.06em] text-blue-600">
                  72.4%
                </h2>
                <p className="mt-3 text-xs font-black text-emerald-600">
                  ▲ 8.6% 지난 분석 대비
                </p>
              </div>

              <div className="mr-2 relative h-25 w-25 shrink-0 rounded-full bg-[conic-gradient(#2563eb_0_72%,#e8eef7_72%_100%)]">
                <div className="absolute inset-[12px] rounded-full bg-white" />
              </div>
            </div>
          </div>

          <MetricCard
            title="맞팔 계정"
            value="72.4K"
            desc=""
            icon="/following.png"
            tone="blue"
          />

          <MetricCard
            title="비맞팔 계정"
            value="27.6K"
            desc=""
            icon="/unfollowing.png"
            tone="red"
          />

          <MetricCard
            title="계정 생성일"
            value="2016.08.15"
            desc=""
            icon="/main_1.png"
            tone="purple"
          />

          <MetricCard
            title="계정 나이"
            value="9년 2개월"
            desc=""
            icon="/main_2.png"
            tone="green"
          />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-2">
            <span className="text-lg">✨</span>
            <div>
              <h2 className="text-base font-black tracking-[-0.03em]">
                AI 관계 분석 리포트
              </h2>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                관계 상태와 관리 전략을 AI가 분석했습니다.
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-blue-100 bg-white p-4">
              <h3 className="text-sm font-black">핵심 인사이트</h3>

              <ul className="mt-3 space-y-2 text-xs font-semibold leading-5 text-slate-700">
                <InsightItem text="전체 비맞팔 중 43%가 1년 이상 유지된 관계입니다." />
                <InsightItem text="장기 비맞팔 비중이 높아 관계 정리 효과가 클 것으로 예상됩니다." />
                <InsightItem text="현재 활동성 규모 대비 맞팔률은 평균 이상입니다." />
                <InsightItem text="정기적인 정리로 계정의 신뢰도와 도달률을 높일 수 있어요." />
              </ul>
            </div>

            <div className="rounded-xl border border-blue-100 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-black">종합 평가</h3>
              </div>

              <p className="mt-3 text-xs font-medium leading-5 text-slate-700">
                당신의 관계는 전반적으로 안정적으로 유지되고 있습니다. 장기
                비맞팔 계정이 다수 있어 정리하면 더 좋아질 수 있습니다.
              </p>

              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-start gap-2">
                  <span className="text-base">💡</span>
                  <div>
                    <p className="text-sm font-black">관리 팁</p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-600">
                      1~3년 구간의 비맞팔 비중이 가장 높게 나타났습니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-[-0.03em]">
                  비맞팔 기간 분포
                </h2>
              </div>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                계정 나이 기준으로 계산한 비맞팔 계정 유지 기간 분포입니다.
              </p>
            </div>
          </div>

          <div className="mt-4 h-[250px]">
            <div className="flex h-full items-end gap-4 border-b border-slate-300 px-3">
              {periodDistribution.map((item) => {
                const height = (item.count / maxCount) * 165;

                return (
                  <div
                    key={item.label}
                    className="flex h-full flex-1 flex-col items-center justify-end"
                  >
                    <div className="mb-2 text-center text-xs font-black leading-4 text-slate-800">
                      <p>{item.count.toLocaleString()}</p>
                      <p className="text-slate-500">({item.rate})</p>
                    </div>

                    <div
                      className="w-full max-w-[64px] rounded-t-md bg-blue-600 shadow-sm"
                      style={{ height: `${height}px` }}
                    />

                    <p className="mt-3 whitespace-nowrap text-xs font-bold text-slate-600">
                      {item.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-blue-50 px-4 py-2 text-center text-xs font-black text-slate-700">
            ⚙️ 장기 비맞팔 비율 43%(11,692명)
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-2">
            <span className="text-lg">💡</span>
            <div>
              <h2 className="text-base font-black tracking-[-0.03em]">
                장기 비맞팔 계정
              </h2>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                오래 유지된 비맞팔 계정 일부를 표시합니다.
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {recommendedCandidates.map((candidate) => (
              <CandidateCard key={candidate.rank} candidate={candidate} />
            ))}
          </div>

          <p className="mt-3 text-[11px] font-medium text-slate-400">
            ※ 추천은 데이터 기반 우선순위이며, 실제 정리는 신중히 결정해주세요.
          </p>
        </section>
      </main>
    </div>
  );
}

function MetricCard({
  title,
  value,
  desc,
  icon,
  tone,
}: {
  title: string;
  value: string;
  desc: string;
  icon: string;
  tone: "blue" | "red" | "green" | "purple";
}) {
  const toneClass = {
    blue: "bg-blue-50",
    red: "bg-red-50",
    green: "bg-emerald-50",
    purple: "bg-violet-50",
  }[tone];

  return (
    <div className="min-h-[132px] rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
      <div className="flex justify-center">
        <div
          className={`mt-4 flex h-10 w-10 items-center justify-center rounded-full ${toneClass}`}
        >
          <img src={icon} alt={title} className="h-15 w-6 object-contain" />
        </div>
      </div>

      <p className="mt-3 text-xs font-black text-slate-700">{title}</p>
      <h3 className="mt-3 text-1xl font-black tracking-[-0.01em]">{value}</h3>
      <p className="mt-2 text-[11px] font-bold text-slate-500">{desc}</p>
    </div>
  );
}

function InsightItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 font-black text-blue-600">✓</span>
      <span>{text}</span>
    </li>
  );
}

function CandidateCard({
  candidate,
}: {
  candidate: {
    rank: number;
    days: number;
    followStartDate: string;
  };
}) {
  const medalClass =
    candidate.rank === 1
      ? "bg-amber-100 text-amber-600"
      : candidate.rank === 2
        ? "bg-slate-200 text-slate-600"
        : candidate.rank === 3
          ? "bg-orange-100 text-orange-600"
          : "bg-slate-100 text-slate-500";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-black ${medalClass}`}
        >
          {candidate.rank}
        </div>
      </div>

      <p className="mt-2 text-x font-black tracking-[-0.04em] text-black-500">
        비맞팔 {candidate.days.toLocaleString()}일
      </p>

      <div className="mt-2 space-y-1.5 text-xs font-semibold text-slate-700">
        <InfoLine label="팔로우 시작일" value={candidate.followStartDate} />
      </div>

      <button
        type="button"
        className="mt-3 w-full rounded-lg border border-slate-200 bg-white py-2 text-xs font-black text-blue-600 transition hover:bg-blue-50"
      >
        X 바로가기 ↗
      </button>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-black text-slate-900">{value}</span>
    </div>
  );
}
