import { InfoPage } from "@/components/site/info-page";

export default function AccessibilityPage() {
  return (
    <InfoPage
      eyebrow="Speak Up"
      title="无障碍说明"
      summary="Speak Up 会逐步补齐键盘访问、清晰标签、颜色对比和媒体替代方案，让更多用户可以顺畅练习表达。"
      sections={[
        {
          title: "当前支持",
          body: "登录表单、主要按钮和公开说明页会尽量使用语义化标签，并保持清晰的文本提示。摄像头和录音相关流程仍会持续优化。",
        },
        {
          title: "后续改进",
          body: "计划增加更完整的键盘焦点状态、录制内容的文字替代、错误提示朗读友好性，以及对低视力用户更稳定的布局和对比度。",
        },
        {
          title: "反馈方式",
          body: "如果你在使用中遇到无法读取、无法点击、颜色难辨或键盘无法操作的问题，请通过问卷调查入口反馈具体页面和操作步骤。",
        },
      ]}
    />
  );
}
