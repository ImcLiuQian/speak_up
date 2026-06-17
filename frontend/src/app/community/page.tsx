import { InfoPage } from "@/components/site/info-page";

export const dynamic = "force-dynamic";

export default function CommunityPage() {
  const discordUrl = process.env.NEXT_PUBLIC_DISCORD_URL?.trim();
  const requestSubject = encodeURIComponent("申请加入 Speak Up Discord 社区");
  const requestBody = encodeURIComponent(
    [
      "我想加入 Speak Up Discord 社区。",
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
      title="Discord 社区"
      summary="社区用于交换练习题、复盘方法和真实演讲场景。正式邀请链接配置后，这里会直接跳转到 Discord。"
      sections={[
        {
          title: "社区计划",
          body: "我们希望把社区做成轻量的表达训练场：分享练习题、复盘模板、开场案例和问答挑战，让每个人都能从别人的表达里获得启发。",
        },
        {
          title: discordUrl ? "加入方式" : "申请方式",
          body: discordUrl
            ? "点击下方按钮即可打开 Discord 邀请链接。"
            : "公开邀请链接暂未配置。你可以先发送邮件申请邀请，维护者会手动回复可用入口。",
        },
      ]}
      action={{
        label: discordUrl ? "打开 Discord" : "申请邀请",
        href: discordUrl || `mailto:liutian.6000@bytedance.com?subject=${requestSubject}&body=${requestBody}`,
        external: Boolean(discordUrl),
      }}
    />
  );
}
