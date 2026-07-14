# 官网图纸 · site-batch-02(实战修漏洞:过去时间 / 手机 Area 下拉 / 13334km 假距离 / 号码校验)

> 仓库:easygospa(GitHub: gaojun3939-lgtm/easygospa)。执行窗口工作目录 `D:\AIOffice\wt-site`(分支 wt/site)。
> 开工先 `git fetch origin && git merge origin/main`。交活附**手机尺寸**(375 宽)+ 桌面的下单表单截图各一套——这批全是手机上暴露的毛病,手机截图是主验收件。

## 铁律

- 主战场只有 `src/components/BookingModal.jsx`,外加允许新建 1 个小工具文件 `src/lib/manilaTime.js`。不碰 booking 提交 payload 的字段结构、不碰 googleMapsLoader / LocationPicker / AddressAutocompleteInput 内部。
- 保持现有 data-testid 不变(`therapist-distance`、`review-cash-booking`、`confirm-step`、各 `data-readability-field` 等)。
- 完工 `npx next build` 必须通过。
- 图纸没覆盖的停下来问,不许自由发挥。

## 任务 1:日期时间一律按马尼拉时间,过去的选不了

病根:`BookingModal.jsx:37` 的 `getTodayDate()` 用 `new Date().toISOString()` —— 那是世界标准时间(UTC),比马尼拉慢 8 小时,凌晨到早上 8 点期间"今天"会算成昨天;而且手机日期转盘对 `min` 属性阳奉阴违,选了过去也不拦。

改造:
1. 新建 `src/lib/manilaTime.js`,导出:
   - `manilaToday()` → 用 `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' })` 取 `YYYY-MM-DD`(en-CA 的格式天然就是这个,别手拼字符串);
   - `manilaNowMinutes()` → 马尼拉当前"分钟数"(小时×60+分,同样走 `Intl` + `timeZone: 'Asia/Manila'`)。
2. `getTodayDate()` 全部换成 `manilaToday()`(min 属性、第 616 行的提交校验都用它)。
3. 日期 `onChange` 当场兜底:选出的值 < `manilaToday()` 时,立即把值改回今天,并在日期栏下方显示一行红色小字 `Please pick today or a future date.`(不许用 alert)。
4. **时间栏联动**:`timeSlots`(第 23 行)渲染前先过滤——当 `formData.preferredDate === manilaToday()` 时,只显示 `时段分钟数 >= manilaNowMinutes() + 60` 的选项(至少留 1 小时准备时间);选了未来日期则全量显示。如果用户先选了今天 14:00 又把日期改回今天且 14:00 已过期,把 preferredTime 清空让他重选。
5. 提交校验(616 行附近)同步加:今天 + 已过期时段 → 提示 `Please pick a later time slot.`。

## 任务 2:Area 换成正式下拉,手机不用打字

病根:`BookingModal.jsx:910-911` 用 `<input list>` + `<datalist>`,iPhone Safari 根本不弹建议,客人只能盲打。

改造:
- 把 Area 输入框换成 `<select>`(样式沿用 `bookingInputClass`,注意 select 要加 `appearance-none` + 右侧自画小箭头,和现有输入框视觉一致):
  - 第一项 `<option value="">Select your area</option>`;
  - 其余选项来自现有 `areaOptions`(第 24 行),值原样,不改数组;
  - 保留 `required` 和 `data-readability-field="area"`。
- 删掉 `<datalist id="easygospa-area-options">`。
- formData.area 的字段名和取值不变(payload 不受影响)。

## 任务 3:掐死 13334km 假距离

病根:手机上有一次请求把客人坐标传成了 (0,0)(赤道零点,离马尼拉恰好 1.33 万公里),前端老老实实显示了出来。服务端防线由后台仓库另一张图纸负责,本图纸只管官网侧两道闸:

1. **源头闸**:`BookingModal.jsx` 里所有把坐标写进状态的入口(约 495-503 行的 `getCurrentPosition` 回调、920 行 `onLocationResolved`、925 行 LocationPicker `onChange`)统一过一个新校验函数(放 `manilaTime.js` 隔壁不合适,就放 BookingModal 顶部):
   ```
   isUsableCoords({latitude, longitude}) →
     两值都是有限数字、不是 (0,0)、且在菲律宾大致范围内(lat 4~21, lng 116~127)才算能用
   ```
   不能用的坐标一律当作"没有定位":不 setCustomerCoords、不带 lat/lng 去请求 `/api/booking-catalog`、不写进 formData.customerLocation。
2. **展示闸**:技师卡片显示距离处(约 229-233 行)加条件——`distanceKm > 100` 的不显示距离行(宁可不显示,不显示笑话)。

## 任务 4:电话号码校验(菲律宾格式)

现状:`BookingModal.jsx:892` 的 WhatsApp / Phone 栏什么都收,填错客服就永远联系不上客人。

改造:
- 输入时允许自由打字,但**失焦或提交时**校验:去掉空格/横线/括号后,必须匹配 `09\d{9}`(11 位本地格式)或 `+?639\d{9}`(国际格式)。
- 不合格:输入框下红色小字 `Please enter a valid PH mobile number, e.g. 0917 123 4567.`,提交拦下。
- 合格:payload 里的 phone 字段保持用户输入原文只做去空格/横线的清理,**不改字段名、不自动改写成 +63 开头**(后台联系时自己会处理)。

## 自检与交活

- `npx next build` 绿。
- 手机尺寸自测清单(逐条截图):
  1. 日期栏选不了昨天(选了自动跳回今天并出红字);
  2. 今天日期下,时间下拉只剩"现在 +1 小时"以后的时段;
  3. Area 点开是原生下拉选单,不用打字;
  4. 拒绝定位授权后走完下单全流程,技师墙不显示距离、不报错;
  5. 乱填号码 `123` 被拦下,`0917 123 4567` 放行。
- 小步提交:任务 1-4 各一个 commit,推 `git push -u origin wt/site`,汇报 commit 哈希。
