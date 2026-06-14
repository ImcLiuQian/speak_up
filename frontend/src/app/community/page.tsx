import { InfoPage } from "@/components/site/info-page";

export default function CommunityPage() {
  return (
    <InfoPage
      eyebrow="Speak Up"
      title="Discord 社区"
      summary="这里预留给 Speak Up 的用户社区入口，用来收集练习心得、产品建议和真实演讲场景。"
      sections={[
        {
          title: "社区计划",
          body: "我们希望把社区做成轻量的表达训练场：分享练习题、复盘模板、开场案例和问答挑战，让每个人都能从别人的表达里获得启发。",
        },
        {
          title: "当前状态",
          body: "正式 Discord 邀请链接还没有配置。上线后，这个入口会直接跳到社区邀请页；在此之前，你可以先通过问卷反馈入口联系维护者。",
        },
      ]}
    />
  );
}
