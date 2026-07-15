# 官网图纸 · site-batch-05(技师墙 NEW 标 + 按推荐分排序)

> 执行窗口:分支 F(wt-site)。**依赖后端 batch-26**(目录返回 `recommendationScore` 降序 + `isNew`)。全英文。不引第三方库。

## 目标
官网技师墙(BookingModal)按后端**推荐分排序**展示,并给新人卡片打 **NEW** 标。

## 两件事(src/components/BookingModal.jsx)
1. **排序**:目录返回的技师列表已按 `recommendationScore` 降序(后端 batch-26 保证)。**官网就按返回顺序渲染,别再自己重排乱它**(现有"最相关/推荐"默认排序沿用此顺序;若有其它排序选项如"最近/评分",保留但默认走推荐分)。在岗技师带 "Earliest HH:MM"(site-batch-04 已做)。
2. **NEW 标**:技师对象 `isNew === true` 的卡片,左上角打一个 **"NEW"** 角标(参考 glow 的 "New arrival" 样式:小圆角标签,蓝/强调色,别抢过头)。`isNew` 为假不显示。

## 红线
- 只动技师墙的排序展示 + NEW 角标;别碰下单提交、定位、时区、坐标、金额、休息警告(site-batch-04)。
- 全英文;移动端 390px 不横向溢出;NEW 标与现有卡片风格一致。
- 不引第三方;`isNew`/顺序都来自后端目录,前端不自算分。

## 验收(交前自查)
- [ ] 技师墙按目录返回顺序(=推荐分)渲染,未被前端重排打乱
- [ ] isNew 的卡片有 NEW 角标;非 New 无
- [ ] 在岗仍显示 Earliest、休息仍弹警告(site-batch-04 不回归)
- [ ] 390px 无溢出;`npm run build` 绿
- [ ] 推 wt/site 交验收,别自己合 main

## 完工回话
回一句:排序落点、NEW 角标组件位置、用了哪个字段、build 结果。
