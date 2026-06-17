import { InfoPage } from "@/components/site/info-page";

export const dynamic = "force-dynamic";

export default function CommunityPage() {
  const wechatQrUrl = process.env.SPEAK_UP_WECHAT_QR_URL?.trim() || process.env.NEXT_PUBLIC_WECHAT_QR_URL?.trim();
  const requestSubject = encodeURIComponent("申请加入 Speak Up 微信社群");
  const requestBody = encodeURIComponent(
    [
      "我想加入 Speak Up 微信社群。",
      "",
      "我常练习的表达场景：",
      "",
      "希望在社区里获得的帮助：",
      "",
    ].join("\n"),
  );

  return (
    <InfoPage
      eyebrow="Speak Up"
      title="微信社群"
      summary="社群用于交换练习题、复盘方法和真实演讲场景。二维码配置后，这里会直接展示微信入群入口。"
      sections={[
        {
          title: "社区计划",
          body: "我们希望把社区做成轻量的表达训练场：分享练习题、复盘模板、开场案例和问答挑战，让每个人都能从别人的表达里获得启发。",
        },
        {
          title: wechatQrUrl ? "加入方式" : "申请方式",
          body: wechatQrUrl
            ? "点击下方按钮即可打开微信二维码，扫码后即可申请加入。"
            : "微信二维码暂未配置。你可以先发送邮件申请邀请，维护者会手动回复可用入口。",
        },
      ]}
      action={{
        label: wechatQrUrl ? "打开微信二维码" : "申请邀请",
        href: wechatQrUrl || `mailto:liutian.6000@bytedance.com?subject=${requestSubject}&body=${requestBody}`,
        external: Boolean(wechatQrUrl),
      }}
    />
  );
}
