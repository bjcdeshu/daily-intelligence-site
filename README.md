# Daily Intelligence

一个用于快速回答四个问题的中文信息仪表盘原型：**什么仍在发展、今天发生了什么、这周形成了什么脉络、接下来应该盯什么。**

[在线体验](https://daily-intelligence-20260627.bjcdeshu-4072.chatgpt.site/)

> **当前状态：v0.1 产品原型。** 仪表盘、分类逻辑、主题筛选和刷新路径已经可运行；页面当前使用可重复生成的示例数据，并不是实时新闻源。

## 已实现

- 将条目组织为 **正在进行中、今天发生、这周发生、需要关注** 四个视图。
- 按重要性和最新活动时间排序，同一条目可同时进入多个相关视图。
- 通过标题、摘要、标签和关键词匹配关注主题。
- 支持添加、删除和筛选自定义主题；自定义主题保存在当前浏览器的 `localStorage` 中。
- 提供 `/api/dashboard` 刷新端点，并在刷新失败时保留当前界面和显示错误状态。
- 使用统一的 `NormalizedItem`、`SourceConfig` 和 `DashboardSnapshot` 数据边界，方便之后替换为真实 RSS/API 适配器。
- 按 UTC+8 切分“今天”和过去 7 天的数据窗口。

## 当前数据边界

仓库里的 Reuters、OpenAI、Anthropic、arXiv 等条目是用于验证产品形态的**示例数据**。标题、摘要和链接不应被当作真实资讯或事实来源。

当前版本尚未包含：

- 实时 RSS/API 抓取；
- 定时采集与持久化快照；
- 历史搜索；
- 多用户同步；
- 通知或日报投递。

下一步真正有价值的工作不是继续加界面，而是接入一组可验证的真实来源，并让刷新与历史状态可持续运行。

## 数据流

```text
示例数据 / 未来的来源适配器
            ↓
       NormalizedItem
            ↓
  buildDashboardSnapshot()
            ↓
  分类 · 排序 · 主题匹配
            ↓
   Server Render + /api/dashboard
            ↓
      浏览器主题筛选
```

## 本地运行

需要 Node.js `>=22.13.0`。

```bash
npm install
npm run dev
```

然后打开终端输出的本地地址。

## 验证

```bash
npm test
npm run build
```

测试覆盖主题匹配、四类视图归组、排序、未知来源回退和关注列表规则；生产构建由 `vinext build` 完成。

## 技术栈

- [vinext](https://github.com/cloudflare/vinext)
- Next.js 16 / React 19
- TypeScript
- Tailwind CSS 4
- Vitest
- Cloudflare Worker-compatible runtime

## 主要目录

```text
app/
├── api/dashboard/       # 动态仪表盘 JSON
├── components/          # 仪表盘和信息卡片
└── lib/
    ├── dashboard.ts     # 分类、排序与主题匹配
    ├── seed-data.ts     # 当前示例来源与条目
    └── types.ts         # 共享数据结构
```

产品目标与第一版边界见 [`docs/superpowers/specs/2026-06-27-daily-intelligence-site-design.md`](docs/superpowers/specs/2026-06-27-daily-intelligence-site-design.md)。
