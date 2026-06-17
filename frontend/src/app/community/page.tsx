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
