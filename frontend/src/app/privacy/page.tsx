import { InfoPage } from "@/components/site/info-page";

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Speak Up"
      title="隐私政策"
      summary="我们只收集训练服务所需的信息，并尽量让每一项数据都服务于你的练习、复盘和账号安全。"
      sections={[
        {
          title: "我们会保存什么",
          body: "账号侧主要保存邮箱、登录会话、会员状态和每日额度使用记录。训练侧可能保存转写文本、报告、回放索引以及你主动上传或录制的练习素材。",
        },
        {
          title: "数据如何使用",
          body: "这些数据用于完成登录验证、限制每日训练额度、生成练习反馈、展示历史复盘，以及排查服务故障。我们不会把你的训练内容用于无关营销。",
        },
        {
          title: "你的选择",
          body: "你可以退出登录并停止新的训练记录生成。若需要删除账号或清理历史数据，可以通过反馈入口联系维护者处理。",
        },
      ]}
    />
  );
}
