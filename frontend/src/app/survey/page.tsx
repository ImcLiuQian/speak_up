import { InfoPage } from "@/components/site/info-page";

export const dynamic = "force-dynamic";

const DEFAULT_SURVEY_URL = "https://x1h3t1kti6o.feishu.cn/share/base/form/shrcnRuZl6UMP7oijTUoxKQVvLe";

export default function SurveyPage() {
  const surveyUrl = process.env.SPEAK_UP_SURVEY_URL?.trim() || process.env.NEXT_PUBLIC_SURVEY_URL?.trim() || DEFAULT_SURVEY_URL;

  return (
    <InfoPage
      eyebrow="产品反馈"
      title="问卷调查"
      summary="这个入口用于收集真实训练反馈。你可以扫码填写，也可以点击按钮打开飞书问卷。"
      visual={{
        src: "/landing-assets/speakup-survey-qr.png",
        alt: "Speak Up 问卷二维码",
        caption: "打开飞书或浏览器扫码，提交后我们会按反馈类型整理到产品待办。",
      }}
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
        label: "打开飞书问卷",
        href: surveyUrl,
        external: true,
      }}
    />
  );
}
