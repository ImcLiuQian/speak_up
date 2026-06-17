import { InfoPage } from "@/components/site/info-page";

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="Speak Up"
      title="服务条款"
      summary="Speak Up 是一个帮助用户练习表达和复盘演讲的训练工具，反馈结果用于辅助练习，不替代专业评审或正式考试结论。"
      sections={[
        {
          title: "合理使用",
          body: "请使用本人可用的内测账号登录，并避免上传侵犯他人权益、包含敏感隐私或违反法律法规的内容。",
        },
        {
          title: "训练记录",
          body: "登录后生成的训练记录会归属到当前账号，用于展示回放、报告和历史复盘。请在练习前确认录制内容适合保存。",
        },
        {
          title: "服务变更",
          body: "我们可能根据产品迭代调整训练模式、报告结构或存储方式，并尽量保持关键变化透明可见。",
        },
      ]}
    />
  );
}
