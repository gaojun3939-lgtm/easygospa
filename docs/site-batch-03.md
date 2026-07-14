# 官网图纸 · site-batch-03(我的订单追踪页 —— 乱码链接免登录,像打车 App)

> 执行窗口:分支 F(wt-site),工作目录 `D:\AIOffice\wt-site`。
> 供数接口:后端 batch-21 的 `GET /api/public/booking-status?ref=...`。**等 batch-21 合并后本页才有真数据;可先按下方契约搭 UI,联调放最后。**

## 一句话目标
客人下完单只拿到一个乱码编号,关掉页面就抓瞎。本批做一个**免登录追踪页**:客人点成功页上的链接,就能看到订单走到哪一步了(像打车 App 那条状态时间线),并能一键 WhatsApp 追问。

## 老板拍板规则(第 5 条原文)
"官网要 My Bookings 追踪页,像打车 App 那样,乱码链接免登录;订单里 WhatsApp 按钮联系客服(一期不做内置聊天)。"

## 要做的两件事

### ① 新增追踪页 `/track/[ref]`
- 路由:`src/app/track/[ref]/page.jsx`(App Router 动态段)。
- **免登录**:凭 URL 里的乱码编号即可看,不需要账号。
- 进页面 → 调**同源代理** `GET /api/booking-catalog` 同款套路,新建 `src/app/api/booking-status/route.js` 代理转发到后端 batch-21 接口(读 env `AIOFFICE_BOOKING_STATUS_API_URL`,缺省回落 `https://staging.easygospa.com/api/public/booking-status`)。**编号只走服务端代理,不把后端地址暴露到浏览器。**
- 显示一条**竖向状态时间线**(六档,后端返回哪档就点亮到哪档):
  1. Booking received(已下单)
  2. Confirmed, matching therapist(已确认,匹配技师中)
  3. Therapist on the way(技师在路上)—— 带技师花名+头像(接口给了才显示)
  4. Therapist arrived(技师已到达)
  5. Service in progress(服务中)
  6. Completed(已完成)
  - 已过的档:实心+对勾;当前档:高亮/呼吸;未到的档:灰。
  - `cancelled` 单独红色态,不套六档。
- 顶部摘要卡:服务名、时长、预约时间(马尼拉时区显示)、区名、订单编号(可一键复制)。
- **WhatsApp 按钮**(接口返回的公开号):`https://wa.me/<号码去掉+和空格>?text=` 预填一句 `Hi, I'd like to check my booking <ref>`。
- **自动刷新**:每 25 秒轮询一次接口(参照技师端同步节奏),外加一个手动"Refresh"按钮;页面隐藏时暂停轮询(`visibilitychange`),省流量。
- 三种边界态:加载中骨架 / 查不到(404 → "We couldn't find this booking. Please check the link or message us on WhatsApp." + WhatsApp 按钮)/ 网络错误(可重试)。

### ② 成功页加入口
- `src/components/BookingModal.jsx` 成功页(`step === 'success'`,现在显示 `createdAppointment?.id`):
  - 加一个主按钮 **"Track my booking"** → 跳 `/track/<createdAppointment.id>`。
  - 加一句小字:"Save this link to check your booking anytime."(乱码链接就是凭证,让客人存下来)。
  - 保留原有 WhatsApp 文案。
- **入口放哪、要不要进导航,老板后面再定** —— 本批只做成功页这个入口,别自作主张往首页/导航加。

## 铁律
- **不引任何第三方 UI 库**(本站已有的 framer-motion/lucide 可继续用,别新增)。
- 追踪页**只读只显示**,不做任何下单/改单动作。
- 不显示后端返回白名单以外的任何东西(接口本就不给敏感字段,前端也别去别处凑)。
- 全英文。
- 追踪页要能被搜索引擎忽略:加 `robots: noindex`(乱码链接不该被爬)。

## 契约(先按这个搭 UI,联调时对齐 batch-21 实测)
```jsonc
GET /api/booking-status?ref=mbr-brand-a-xxxx
200 → { ok:true, reference, status, statusLabel, placedAt, scheduledAt,
        serviceName, durationMinutes, areaName,
        therapist:{name,avatarUrl}|null, etaMinutes|null, whatsapp, updatedAt }
404 → { ok:false, reason:'not_found' }
// status ∈ submitted | confirmed | on_the_way | arrived | in_service | completed | cancelled
```

## 验收(交 B 前自查)
- [ ] `npm run build` 绿
- [ ] 干净浏览器实测:成功页点"Track my booking"能进追踪页并点亮正确档位(联调后)
- [ ] 404 编号走边界态、WhatsApp 按钮可点
- [ ] 手机 390px 无横向溢出;时间线在窄屏可读
- [ ] `noindex` 生效
- [ ] 干完推 wt/site,交 B 验收,别自己合 main

## 完工回话
回一句:追踪页路由、代理路由、六档时间线组件在哪、成功页入口截图或结构、边界态如何、build 是否绿。
