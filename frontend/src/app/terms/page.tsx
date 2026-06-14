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
          body: "请使用真实可联系的邮箱登录，并避免上传侵犯他人权益、包含敏感隐私或违反法律法规的内容。",
        },
        {
          title: "额度与付费",
          body: "免费账号默认提供每日 10 分钟训练额度；付费能力当前按产品原型模拟展示，正式收费前会补充清晰的支付和退款说明。",
        },
        {
          title: "服务变更",
          body: "我们可能根据产品迭代调整训练模式、报告结构、额度策略或存储方式，并尽量保持关键变化透明可见。",
        },
      ]}
    />
  );
}
