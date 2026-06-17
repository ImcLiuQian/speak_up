import { redirect } from "next/navigation";

const SURVEY_URL = "https://x1h3t1kti6o.feishu.cn/share/base/form/shrcnRuZl6UMP7oijTUoxKQVvLe";

export function GET() {
  redirect(SURVEY_URL);
}
