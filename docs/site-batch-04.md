# 官网图纸 · site-batch-04(技师墙显示"最早可约";点休息技师下单弹"正在休息"警告)

> 执行窗口:分支 F(wt-site),工作目录 `D:\AIOffice\wt-site`。
> 后端地基已上线(batch-23):公共目录每个技师带 `onShift`(现在是否在岗)、`earliestAvailable`("HH:MM" 或 null)。
> 全英文。不引第三方库(现有 framer-motion/lucide 可继续用)。马尼拉时区显示。

## 老板要的(参考 glow,第 4、5 条)
- **在岗**技师:卡片显示"**Earliest HH:MM**(最早可约)"。
- **休息**技师:列表里**照常显示、不加特殊标记**;只有客人**点它下单时**才弹"该技师正在休息,接单概率低,是否继续?"(仍可继续下单)。

## 要改的两处(src/components/BookingModal.jsx)

### ① 技师墙卡片显示最早可约
- 现在卡片上写死的 "Available after confirmation" → 改成按后端字段:
  - `onShift === true 且 earliestAvailable` 有值 → 显示绿色 **"Earliest {earliestAvailable}"**(如 "Earliest 12:00")。
  - 否则(休息)→ **不显示最早可约那一行**(保持卡片干净,别加"休息中/resting"字样——老板要"不加标记")。原有的服务区域/评分/距离照常显示。
- `TherapistWallCard` 里落地;字段从技师对象读(catalog 已含 `onShift`/`earliestAvailable`)。

### ② 点休息技师下单 → 弹"正在休息"警告
- 客人在技师墙点某个 **休息**(`onShift !== true`)技师去下单时,先弹一个确认弹窗:
  - 标题 **Warning**,正文 **"Therapist is currently resting, low chance of accepting orders, do you still want to continue?"**
  - 两个按钮:**Cancel**(取消,留在列表)/ **Continue anyway**(继续,进入该技师下单流程)。
  - 在岗技师(`onShift === true`)**不弹**,直接进下单。
- 弹窗样式跟站点现有风格一致,别引第三方组件。

## 红线
- 只动技师墙展示 + 下单前的休息警告,别碰下单提交、定位、时区、坐标闸这些既有逻辑。
- 金额只展示后端字段,不前端算。
- 全英文;移动端 390px 不横向溢出;休息技师**仍可下单**(警告后 Continue 即进流程)。

## 验收(交前自查)
- [ ] 在岗技师卡片显示 "Earliest HH:MM";休息技师不显示该行、也无"resting"标记
- [ ] 点休息技师下单弹 Warning(可 Cancel / Continue anyway),在岗技师不弹
- [ ] 休息技师 Continue 后能正常走到下单
- [ ] 手机 390px 无横向溢出;`npm run build` 绿
- [ ] 推 wt/site 交验收,别自己合 main

## 完工回话
回一句:卡片最早可约落地在哪、休息警告弹窗组件在哪、在岗/休息判定用的字段、build 结果。
