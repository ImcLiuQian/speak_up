import { InfoPage } from "@/components/site/info-page";

export const dynamic = "force-dynamic";

export default function CommunityPage() {
  const wechatQrUrl = process.env.SPEAK_UP_WECHAT_QR_URL?.trim() || process.env.NEXT_PUBLIC_WECHAT_QR_URL?.trim();
  const requestSubject = encodeURIComponent("申请添加 Speak Up 微信");
  const requestBody = encodeURIComponent(
    [
      "我想添加 Speak Up 微信。",
      "",
      "我常练习的表达场景：",
      "",
      "希望获得的帮助：",
      "",
    ].join("\n"),
  );

  return (
    <InfoPage
      eyebrow="Speak Up"
      title="微信联系"
      summary="这里展示的是维护者的个人微信二维码，用于内测反馈、问题定位和使用交流。"
      visual={
        wechatQrUrl
          ? {
              src: wechatQrUrl,
              alt: "Speak Up 微信二维码",
              caption: "打开微信扫一扫，添加好友时请备注 Speak Up 内测。",
            }
          : undefined
      }
      sections={[
        {
          title: "联系说明",
          body: "这个入口主要用于内测阶段的沟通：反馈训练问题、同步复现步骤、交流真实表达场景，以及后续邀请访谈。",
        },
        {
          title: wechatQrUrl ? "添加方式" : "申请方式",
          body: wechatQrUrl
            ? "扫描上方二维码即可添加个人微信。如果页面截图不方便识别，也可以点击下方按钮打开二维码原图。"
            : "微信二维码暂未配置。你可以先发送邮件说明你的使用场景，维护者会手动回复。",
        },
      ]}
      action={{
        label: wechatQrUrl ? "打开二维码原图" : "申请邀请",
        href: wechatQrUrl || `mailto:liutian.6000@bytedance.com?subject=${requestSubject}&body=${requestBody}`,
        external: Boolean(wechatQrUrl),
      }}
    />
  );
}
