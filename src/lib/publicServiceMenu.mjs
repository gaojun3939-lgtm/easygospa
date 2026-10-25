import { normalizePublicBookingCatalog } from './bookingCatalogNormalizer.mjs';
import { resolveAiOfficeApiUrl } from './aiofficeApiBase.mjs';

// 官网公开价目:首页服务卡、/services、/pricing 三处共用(2026-10-26 老板定:价格摆到明面上,重新申请 Xendit)。
// 名字、介绍、每档价格全读后台,跟下单弹窗第 3 步「My Services」是同一份 —— 后台改一次,全站跟着变。
//
// ⚠ 读不到就直接抛错,不退回任何写死的价目。三个页面都按 revalidate 定时重算:
//   - 平时重算失败 → Next 继续给上一次算好的页面,客人看到的仍是上一次的真价;
//   - 部署时读不到 → 这次构建失败,线上保持旧版本,等后台恢复重新部署即可。
// 千万别再接 getFallbackWebsiteBookingCatalog():那是建站时的示例目录,
// Swedish ₱2,500 / Deep Tissue ₱3,500 这种比真价贵两三倍的假价,还带着我们没有的项目。
export async function loadPublicServiceMenu() {
  const backend = resolveAiOfficeApiUrl('bookingCatalog');
  if (!backend.ok) throw new Error(`Public service menu unavailable: ${backend.code}`);
  const response = await fetch(backend.url, { next: { revalidate: 60 } });
  if (!response.ok) throw new Error(`Public service menu unavailable: HTTP ${response.status}`);
  const payload = await response.json();
  // 后端回的是 {ok, data:{...}} 双层信封或直接平铺,两层都要试(见 [[growth-api-double-envelope]])
  const raw = payload?.data ?? payload;
  if (!raw || payload?.ok === false) throw new Error('Public service menu unavailable: backend returned not ok');
  return normalizePublicBookingCatalog(raw).services;
}
