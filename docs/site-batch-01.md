# 官网图纸 · site-batch-01(技师星级 + 首页去重 + 去假数据)

> 仓库:easygospa(GitHub: gaojun3939-lgtm/easygospa)。执行窗口工作目录 `D:\AIOffice\wt-site`(分支 wt/site)。
> 开工先 `git fetch origin && git merge origin/main`。交活附首页 + 预约弹窗技师墙的桌面+手机截图。

## 铁律

- 只改本文点名的组件;不碰 `src/lib/` 的数据契约、不碰 booking 提交 payload、不碰 googleMapsLoader/LocationPicker。
- 保持现有 data-testid 不变(有测试依赖):`therapist-result-count`、`booking-therapist-list`、`therapist-distance` 等一律保留。
- 完工 `npx next build` 必须通过。

## 任务 1:技师卡片显示星级(把文字评分升级成星星)

现状 `src/components/BookingModal.jsx` 的 `realReviewsLabel` 只输出纯文字 `4.8 (12 verified reviews)`,无评价时输出 `No verified reviews yet`。
改造:
- 有 `therapist.rating`(且 `reviewCount>0`)时,渲染**实心/半星图标行 + 数字 + "(N)"**(用 lucide-react 的 Star 图标,金色 #f0b429;满分 5 星,按 rating 画实心星,半星可用半填充或就近取整)。
- 无评价时保留诚实文案 `No verified reviews yet`(不许编造星级)。
- 技师墙卡片(约 line 205)与详情页(约 line 306)两处都要用新的星级展示;抽成一个小组件 `TherapistRating` 复用。
- 数据已由后台公共目录提供(rating/reviewCount/recentReviews),前端只展示,不计算。

## 任务 2:首页去掉重复的服务板块

首页 `src/app/page.*` 同时渲染了 `ServicesSection`(详细服务卡)和 `CategoriesSection`(自动滚动走马灯),两者展示的是同一批服务,重复。
- **保留 `ServicesSection`**(信息完整),**移除 `CategoriesSection`**(装饰性走马灯,内容重复):从 page 渲染中删掉 `<CategoriesSection />` 及其 import;组件文件可保留不删(以防将来复用)。
- 删除后检查上下板块间距,保持首页节奏顺畅、不留空档。

## 任务 3:处理 StatsSection 里难看的“0 条评价”

老板拍板:`Happy Customers 5000+` 和 `Verified Therapists 50+` 两个数字**保留不动**。
只改一处:`Verified Reviews 0`（0 条评价显示出来很难看）——
- 把这一项从四个统计里**移除**,StatsSection 改为展示其余三项（Happy Customers 5000+ / Verified Therapists 50+ / Service Hours 24/7），布局按三项重新均分。
- 不新增捏造数字，不动其它两个数字与计数动画风格。
（等将来有真实评价后，可再把“Verified Reviews”以真实数接回，本次先去掉。）

## 交活

2–3 个 commit,推 `git push -u origin wt/site`,附截图 + build 结果。判断不准的(比如星星画法、板块取舍)先做我图纸写的默认方案,截图给我看,不满意再调。
