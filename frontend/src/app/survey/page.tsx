import { InfoPage } from "@/components/site/info-page";

export default function SurveyPage() {
  return (
    <InfoPage
      eyebrow="产品反馈"
      title="问卷调查"
      summary="如果你愿意，告诉我们你最想用 Speak Up 练什么场景、哪里卡住、哪类反馈最有帮助。"
      sections={[
        {
          title: "我们想了解",
          body: "你的常见演讲场景、每次练习的目标时长，以及你对转写、节奏分析、问答和回放报告的优先级感受。",
        },
        {
          title: "怎样反馈",
          body: "当前先用邮件收集反馈，后续会替换成正式问卷。你可以直接描述一次真实练习过程，也可以列出最希望优先改进的 3 个点。",
        },
      ]}
      action={{
        label: "发送反馈邮件",
        href: "mailto:liutian.6000@bytedance.com?subject=Speak%20Up%20%E4%BD%BF%E7%94%A8%E5%8F%8D%E9%A6%88",
      }}
    />
  );
}
