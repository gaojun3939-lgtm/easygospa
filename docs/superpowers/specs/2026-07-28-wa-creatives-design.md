# WA 场三匹马素材排版机设计

日期：2026-07-28  
仓库：`easygospa-ai`  
对应工单：`docs/codex-tasks/2026-07-28-wa-creatives.md`

## 目标与边界

实现一个可重复运行的本地排版机，一次生成三匹 WhatsApp 广告赛马的素材：

- 马 A（加班族肩颈）、马 C（怕堵车）、马 B（夜猫子）；
- 每匹至少 2 个版式，每个版式输出 1:1（1080×1080）、4:5（1080×1350）、9:16（1080×1920）；
- 最少 18 张 PNG，文件名分别以 `wa-a-`、`wa-c-`、`wa-b-` 开头；
- 第一次运行只生成本地文件，老板检查并批准后，第二次显式带 `--upload` 才进入图片库。

不生成或伪造任何技师脸，不编造星级、客户数或价格，不把同行参考图放入成品，也不自动批准或点火广告。

## 设计语言

参考广告只借鉴构图规律，不复制整图。所有成品使用 EasyGoSpa 本地莲花标和绿金品牌色：

- 实拍底图优先：从原料站/技师照片清单读取真实照片；真实脸允许使用，但不生成新脸；
- 没有合适实拍时使用照片感底图：深暖渐变、颗粒/织物纹理、柔和光斑和真实物件暗示，不使用几何人物或插画作为主体；
- 插画只作为小点缀（例如小货车图标），不承担主体画面；
- 大字药丸、品牌色画框、暗调 MESSAGE NOW/WhatsApp 气泡分别对应工单和参考广告套路；
- 使用系统必有字体。字体加载或文字渲染失败必须抛错并停止该张/整批，不输出空字图。

## 三匹马与版式

排版机使用固定、可审计的配置，不接受任意文案覆盖：

### 马 A：加班族肩颈

1. 实拍肩颈/手技底图 + 白色圆角大字药丸：
   `Stiff neck from too many meetings? A licensed therapist comes to you.`
2. 办公桌/傍晚客厅构图 + 绿金画框/衬线标题：
   `Your shoulders carried the whole week. Let them rest — massage at home.`

每张 A 素材还要包含 Taglish 钩子 `Pagod ka na ba sa buong linggo?` 或以上主文案之一。

### 马 C：怕堵车

1. 左侧堵车/红尾灯、右侧家中按摩的照片感对比卡，主文案：
   `Skip the EDSA traffic. The spa comes to you.`
2. 品牌色画框 + 衬线标题，备选文案：
   `2 hours in traffic — or 0 minutes? Massage comes home.`

每张 C 素材还要包含 Taglish 钩子 `Traffic pa? Sa bahay ka na lang mag-relax.` 或以上主文案之一。

### 马 B：夜猫子

1. 暗调暖光实拍感底图 + WhatsApp 聊天气泡：
   `"Available tonight, 11 PM?"` → `"Yes po! Therapist can arrive in 40 mins 🌙"`
2. 夜景窗/暖灯深色大字报：
   `Still up at midnight? So are we. Open till 2 AM.`

每张 B 素材还要包含 Taglish 钩子 `Gising ka pa ba? Kami rin po.` 或以上主文案之一，画面保持安静高级，不做暧昧暗示。

## 数据与素材来源

1. 价格从 `buildBillOfMaterials()` 的实时 `prices` 读取；排版配置只指定服务/时长选择规则，不写死金额。没有有效价格时整批失败。
2. 真实照片从 `listUsablePhotos()` 读取；只使用 `eligible` 技师照片。下载失败或没有合适照片时进入照片感背景 fallback，并在运行日志标明 fallback 原因。
3. 莲花标从 `ai-office-admin/public/brand/lotus-mark.svg` 复制到本仓库 `public/brand/lotus-mark.svg`，脚本只读本仓库路径，禁止运行时跨仓库读取。
4. 成品只允许出现真实信任行的子集：
   `Professional therapists`、`Pay cash after your massage`、`Serving Makati & BGC`。
5. CTA 只允许 `Message us on WhatsApp` 或 `Chat to book`，禁止 `Book now`。

## 脚本与上传流程

目录：`scripts/creative-press/`。

- `press.mjs`：读取配置、素材和价格，使用 Sharp 合成 PNG；默认 dry-run，只写 `artifacts/creative-press/<run-id>/`；
- `validate.mjs`：检查张数、尺寸、命名、三匹马前缀、马归属文案/Taglish、CTA、价格来源和禁用词；
- `README.md`：记录字体要求、环境变量、dry-run 与 `--upload` 用法，以及老板审批后再上传的流程；
- `--upload`：逐张以 multipart 调用现有 `/api/console/ads/images`，沿用控制台会话，不直接写 Meta 或绕过现有路由；上传失败立即记录文件名与原因，不伪造成功。

脚本不执行任何表结构变更。上传前先检查 `ai_ad_images` 现有字段：有现成待审字段就复用；没有则只新增一个供老板手跑的 `sql/` 迁移文件，脚本本身不运行迁移。赛马向导只做最小过滤改动：未批准图片不得进入可选素材，批准点火流程保持原有状态机。

## 待审状态方案

仓库当前 `sql/007_ads_engine.sql` 的 `ai_ad_images` 定义没有显式状态字段，因此实现时先核对实际表字段和现有代码，再决定复用 `status`/同类字段还是产出条件迁移。若确实没有可复用字段，新增迁移使用 `pending_review` 默认值，并保留明确的 approved/rejected 状态约束；迁移只提交文件，由老板在 Supabase SQL Editor 手动执行。

在迁移未执行时，脚本仍可 dry-run 生成本地素材；`--upload` 必须检测到可写的待审状态能力，否则拒绝上传并说明需要先跑迁移，避免生成“无待审保护”的图片。

## 验收与失败策略

- 本地生成必须得到至少 18 张非空 PNG，精确尺寸为三种规格；
- `wa-a` 每张包含 A 主文案或 Taglish，`wa-c` 每张包含 C 主文案或 Taglish，`wa-b` 每张包含 B 主文案或 Taglish；
- 每张包含真实 BOM 价格、允许的信任行（可选）和聊天 CTA；
- 扫描最终渲染文本，禁止星级、客户数、`Book now` 和跨马文案；
- 无人脸生成路径：脚本只读取真实照片或照片感背景，不调用图像生成模型；
- 任何字体、照片、价格、PNG 渲染、上传或状态字段错误都返回非零退出码并保留日志；不输出空字图或伪成功记录；
- 上传后的记录必须处于待审状态，且赛马选择列表不显示未批准记录；
- 构建、脚本验收和（若配置本地服务）上传回读分别报告，不把本地生成通过冒充线上入库通过。

