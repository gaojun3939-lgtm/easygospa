# 图纸:优惠券体验闭环(自动用券 + 券包红点 + 完成单评价入口)

> 出图:Claude · 执行:Codex · 老板 2026-07-22 拍板"开始吧"
> 仓库:easygospa(官网)为主;若自动用券需后端配合,ai-office-admin 同步(见第三节)
> 前提:评价/券接口的两个环境变量(AIOFFICE_BOOKING_REVIEW_API_URL /
> AIOFFICE_MY_COUPONS_API_URL)由老板在 Vercel 配好——本图纸是配好之后的体验完善。
> ⚠️ 金额红线已在批5验证通过(技师全额不变、平台吃券、现金−50);本批不得改动分账逻辑,
> 只做"券的自动应用与展示"。任何改动若触及金额计算,停下报告。

## 一、完成单加评价入口(CustomerOrders.jsx · "我的订单"弹窗)

现状:完成单在"Order status"弹窗里只有「Message us on WhatsApp」+「Report a problem」,
没有评价入口;评价卡只在追踪页(BookingTrackingPage)有。

改:completed 状态的订单,在弹窗时间线下方、WhatsApp 按钮之上,加一张评价 CTA:
- 若该单尚未评价:主按钮「Rate your massage · Get ₱50 coupon」(金/绿主色),
  点击 → 复用追踪页那套评价卡逻辑(五星 + 选填评语 + 提交),就地展开或跳到评价卡。
- 若该单已评价:显示「★★★★★ Reviewed · ₱50 coupon sent」灰态,不可重复评。
- 一单一评状态以后端返回为准(前端不自行判断放行)。
- 评价提交成功 → 就地提示「Thanks! ₱50 coupon added to your wallet」+ 触发券包红点(见二)。

## 二、券包红点 + 自动可用提示(CustomerOrders.jsx · 预订/优惠券 切换条)

现状:切换条第 259-260 行两个 tab(Bookings / Coupons),无红点。

改:
1. 有 >=1 张 active(未用未过期)券时,Coupons tab 文字右上角加一个红点
   (小圆点 8px 红,复用三端红点风格;纯提示,不显数字也可,若易做则显数字更好)。
2. 红点数据来源:已加载的 coupons 里 status==='active' 的数量;无需新接口。
3. 券包列表(CouponWallet)active 券卡片顶部加一行醒目提示:
   「Auto-applied on your next booking」——让客人知道不用手动操作,下单自动抵扣。

## 三、下单自动用券(BookingModal.jsx 确认步 + 后端 public-request)

现状(截图):确认步"使用优惠券"只写一句"提交后系统会核实折扣",不展示、不自动、
客人下单前看不到 −₱50。老板要:**有券就自动用,并且要看得见。**

老板拍板行为:
- 客人在确认步填了邮箱/手机后,若该客人有 active 券 → **自动应用一张**(无门槛任何单可用,
  一单一张不叠加),确认卡金额区展示:
  - `全部的  ₱1,000`
  - `优惠券  − ₱50(已自动使用)`  ← 绿色
  - `现金支付  ₱950`  ← 加粗主数
- 客人可有一个「不用券」的小链接退出自动应用(可选,若实现成本低就做:让客人留着券下次用)。
- 无 active 券:维持原样,只显示全额,不出现券行。

实现要点(Codex 择清爽路径,以下为约束不是强制写法):
- 券的归属校验、核销、金额计算**权威在后端**(public-request 已具备 couponId 校验与
  金额红线,批5验过)。前端只负责:查出该客可用券 → 把 couponId 随单带上 → 展示后端回算的金额。
- 查客人可用券:优先复用 my-coupons(需登录态);若确认步是游客态(仅填了邮箱),
  则由**后端在 public-request 内自动匹配 customerKey 的 active 券并应用**,响应回传
  applied/discount/cashToCollect,前端照后端结果展示。**二选一,后端自动匹配更稳,推荐后端做。**
- 若后端自动匹配:public-request 在未显式传 couponId 时,按下单人 customerKey 查一张
  active 券自动核销;显式传"不用券"标记时跳过。**金额分账仍按批5红线:平台吃 50、技师全额不变。**
- 幂等:重复提交同一请求不得重复核销两张券(沿用现有幂等键)。

## 四、验收

- 官网 build 通过;lint 不新增 error。
- 新增/扩展验收脚本(或在 check-website-review-coupon-loop.mjs 增用例):
  | 用例 | 期望 |
  |---|---|
  | 有 active 券的客人下单 | 自动应用一张,确认卡显示 −₱50/现金₱950,后端金额红线仍 pass |
  | 无券下单 | 无券行,全额,正常下单 |
  | 选"不用券" | 不核销,券保持 active,全额下单 |
  | 完成单未评价 | 弹窗显示评价 CTA;提交后显示已评+券到账 |
  | 完成单已评价 | 显示已评灰态,不可重复评 |
  | 有 active 券 | Coupons tab 显示红点;用掉后红点消失 |
- 金额红线脚本(check-review-coupon-loop.mjs / check-website-review-coupon-loop.mjs)必须仍全绿。

## 五、红线

1. 不改批5的金额分账逻辑;自动用券只是"默认帮客人应用",钱怎么分一个字不动。
2. 触及金额计算就停下报告,不硬凑。
3. 文案:官网英文;确认卡"优惠券"行中文台这边不涉及(官网是英文界面)。
4. 一单一评、券归属、幂等,权威判断都在后端,前端不自行放行。

## 六、交付

- easygospa 一个提交(如后端自动匹配则 ai-office-admin 一个提交),不 push;
- 报告 docs/COUPON_UX_REPORT.md:逐条对照 + 截图(完成单评价CTA/券包红点/确认步自动−₱50)+
  金额红线脚本输出;图纸定错直说。
