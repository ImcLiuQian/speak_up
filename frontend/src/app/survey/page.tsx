import { InfoPage } from "@/components/site/info-page";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function SurveyPage() {
  const surveyUrl = process.env.NEXT_PUBLIC_SURVEY_URL?.trim();
  if (surveyUrl) {
    redirect(surveyUrl);
  }

  const feedbackSubject = encodeURIComponent("Speak Up 使用反馈");
  const feedbackBody = encodeURIComponent(
    [
      "我想反馈的训练场景：",
      "",
      "这次使用中最顺手的地方：",
      "",
      "最希望改进的地方：",
      "",
      "是否愿意参与后续访谈：",
      "",
    ].join("\n"),
  );

  return (
    <InfoPage
      eyebrow="产品反馈"
      title="问卷调查"
      summary="这个入口用于收集真实训练反馈。你可以直接发邮件告诉我们练习场景、卡点和最想优先改进的功能。"
      sections={[
        {
          title: "反馈内容",
          body: "你的常见演讲场景、每次练习的目标时长，以及你对转写、节奏分析、问答和回放报告的优先级感受。",
        },
        {
          title: "处理方式",
          body: "收到反馈后，我们会按问题类型整理到产品待办中。涉及账号、录制或报告异常时，请尽量带上发生时间和操作步骤，方便定位。",
        },
      ]}
      action={{
        label: "发送反馈邮件",
        href: `mailto:liutian.6000@bytedance.com?subject=${feedbackSubject}&body=${feedbackBody}`,
      }}
    />
  );
}
