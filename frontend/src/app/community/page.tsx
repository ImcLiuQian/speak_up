import { InfoPage } from "@/components/site/info-page";

export const dynamic = "force-dynamic";

export default function CommunityPage() {
  const wechatQrUrl = process.env.SPEAK_UP_WECHAT_QR_URL?.trim() || process.env.NEXT_PUBLIC_WECHAT_QR_URL?.trim();

  return (
    <InfoPage
      eyebrow="Speak Up"
      title="微信联系"
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
          title: wechatQrUrl ? "添加方式" : "申请方式",
          body: wechatQrUrl
            ? "扫描上方二维码即可添加个人微信。如果页面截图不方便识别，也可以点击下方按钮打开二维码原图。"
            : "微信二维码暂未配置。配置完成后，这里会展示可扫码添加的个人微信。",
        },
      ]}
      action={
        wechatQrUrl
          ? {
              label: "打开二维码原图",
              href: wechatQrUrl,
              external: true,
            }
          : undefined
      }
    />
  );
}
