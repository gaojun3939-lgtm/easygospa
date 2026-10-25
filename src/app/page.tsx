import HomePage from "../components/HomePage";
import { loadPublicServiceMenu } from "../lib/publicServiceMenu.mjs";

// 2026-10-26:首页服务卡要显示后台真价(Xendit 审核要一眼看到价格)。
// 每 60 秒最多重算一次;读不到后台时继续给上一次的页面,规则见 lib/publicServiceMenu.mjs。
export const revalidate = 60;

export default async function Home() {
  const services = await loadPublicServiceMenu();
  return <HomePage services={services} />;
}
