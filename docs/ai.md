# AI 能力说明

本项目的 AI 分三层：**规则引擎（默认，离线可用）**、**工具编排（Copilot）**、**模型接入（可选）**。
默认零依赖即可运行；配置环境变量后可平滑切到真实大模型，业务代码不用改。

---

## 一、能力总览

| 能力 | 入口 | 接口 | 数据依赖 |
| --- | --- | --- | --- |
| 智能对话（Copilot） | `/ai/` → 智能对话 | `POST /ai/copilot` | 学生 / 考勤 / 成绩 / 请假 / 一卡通 / 报修 / 综评 |
| 知识库检索 | `/ai/` → 知识库 | `GET /ai/knowledge/search` | 10 条制度文档（`mock/knowledge.ts`） |
| 学情报告 | `/ai/` → 学情报告 | `POST /ai/report` | 成绩 + 考勤 |
| 智能查询 | 所有列表页「智能查询」 | `POST /ai/nl2query` | 各页面的查询栏 schema |
| 家长周报 | `/parent/` → 周报 | `POST /ai/parent-report` | 成绩 + 考勤 + 请假 + 综评 |
| 报表解读 | `/bbzx/` → AI 解读 | `POST /ai/report-insight` | 报表结果集 |

---

## 二、Copilot 工具编排

`packages/apis/campus/mock/copilot.ts` 内置 7 个**只读**工具：

| 工具 | 触发词 | 返回 |
| --- | --- | --- |
| `queryStudents` | 学生 / 名单 / 花名册 | 指标卡 + 学生明细 |
| `queryAttendance` | 考勤 / 出勤 / 迟到 / 缺勤 | 出勤率指标 + 异常人员 TOP |
| `queryScores` | 成绩 / 分数 / 均分 / 及格 | 均分/及格率 + 学科对比 |
| `queryLeave` | 请假 / 审批 / 待办 | 状态分布 + 待审批列表 |
| `queryCards` | 一卡通 / 余额 / 消费 | 余额/交易指标 + 余额不足名单 |
| `queryRepairs` | 报修 / 工单 / 维修 | 工单状态 + 待接单列表 |
| `queryEvaluations` | 综合素质 / 德育 / 评价 | 平均分 + 等级分布 |

响应结构（前端据此渲染指标卡与表格）：

```jsonc
{
  "intent": "attendance.summary",
  "tool": "queryAttendance",
  "params": { "className": "高一(1)班", "days": 30 },
  "reply": "近 30 天共 320 条考勤记录，出勤率 84.4%…",
  "cards": [
    { "type": "metrics", "title": "考勤概览", "metrics": [{ "label": "出勤率", "value": 84.4, "unit": "%" }] },
    { "type": "table", "title": "异常人员 TOP", "columns": [], "rows": [] }
  ],
  "followUps": ["这些缺勤有没有请假记录"]
}
```

**安全边界**

1. 工具全部只读，不提供任何写操作（不审批、不删除、不改分）。
2. 未命中工具时回落到通用问答，不会返回空响应。
3. 意图优先级：业务词优先于「学生」这类宽泛词，避免「有多少学生请假」被学生工具抢走。

> 接真实模型时，上表就是 function-calling 的工具清单，把 `runCopilot` 换成模型决策即可。

---

## 三、模型接入层

```
浏览器 ──POST /ai-proxy/chat/completions──▶ 代理（服务端注入 Key）──▶ 模型服务
```

**路由策略**：三级路由，兼顾速度与覆盖面。

| 顺序 | 触发条件 | 行为 | 延迟 |
| --- | --- | --- | --- |
| 1 | 命中规则关键词 | 直接执行工具，返回结论 + 卡片 | ~0ms |
| 2 | 未命中且已接模型 | 模型带工具清单自行决策（function calling） | 1 次模型调用 |
| 3 | 模型决定调工具 | 执行工具 → 结果回传 → 模型流式总结 | 2 次模型调用 |

气泡上会显示来源：「已调用工具 · queryAttendance」或「模型回答 · deepseek-flash」。

实测：问「本周考勤怎么样」走规则（1 个工具、2 张卡）；问「最近有没有什么异常情况需要我重点处理？」
模型会自行调用 考勤 + 请假 + 一卡通 三个工具，汇总成带优先级的建议（8 张卡）。

> 实现细节：DeepSeek 思考模式要求把 `reasoning_content` 原样回传，否则多轮工具调用会 400；
> 且 assistant 的 `tool_calls` 必须与 tool 消息严格一一对应，失败的工具也要回一条说明。

**流式输出**：`chatWithModelStream` 消费 SSE / NDJSON，逐字更新气泡（代理已做透传）。
降级顺序为 `流式 → 一次性请求 → 规则引擎`，任一步失败都不影响可用性。
解析逻辑抽成纯函数 `extractDelta`，单测覆盖 OpenAI 块、Ollama 块、`[DONE]`、半行 JSON、usage 帧等边界。

| 文件 | 职责 |
| --- | --- |
| `packages/apis/campus/ai/provider.ts` | Provider 契约与调用封装（openai / ollama），系统提示词 |
| `server/ai-proxy.mjs` | 代理中间件：注入 `Authorization`、透传 SSE、未配置上游时返回 503 |
| `vite.config.ts` | 开发期把 `/ai-proxy/*` 挂到 dev server |
| `.env.example` | 环境变量说明 |

### 切换模型

```bash
# .env.local（已被 .gitignore 的 *.local 忽略）
VITE_AI_PROVIDER=openai          # 或 ollama；设 rule 即只走规则引擎
VITE_AI_MODEL=deepseek-flash     # 必须是接口的 model id

# 仅服务端可见，不能加 VITE_ 前缀
AI_UPSTREAM_BASE=https://api.deepseek.com/v1
AI_API_KEY=sk-xxxx
```

> **展示名 ≠ model id**：控制台里显示为「DeepSeek-V4.1-Flash」的模型，接口里要传 `deepseek-flash`，
> 直接传展示名会返回 HTTP 400。不确定时先列一下可用模型：
>
> ```bash
> curl -s https://api.deepseek.com/v1/models -H "Authorization: Bearer $AI_API_KEY"
> ```

改完 `.env.local` 需要**重启 dev server**（配置在启动时读取）。`vite.config.ts` 用
`loadEnv(mode, cwd, "")` 读取非 `VITE_` 变量，只交给代理中间件，不会打进前端产物
（可用 `Select-String -Path "dist\assets\*.js" -Pattern "sk-"` 自查）。

本地 Ollama：

```bash
VITE_AI_PROVIDER=ollama
AI_UPSTREAM_BASE=http://127.0.0.1:11434
AI_MODEL=qwen2.5:7b
```

生产环境把 `server/ai-proxy.mjs` 单独起服务：

```bash
AI_UPSTREAM_BASE=... AI_API_KEY=... node -e "import('./server/ai-proxy.mjs').then(m => m.startStandalone(8787))"
```

---

## 四、合规与风险提示

1. **密钥只在服务端**：前端只认 `/ai-proxy`，Bundle 里不含任何 key。
2. **数据脱敏**：`CAMPUS_SYSTEM_PROMPT` 明确要求不输出完整证件号与住址；生产环境建议在代理层再做一次字段替换。
3. **不做最终结论**：AI 输出仅作参考，评优、处分等决策必须由人做出。
4. **可降级**：规则引擎始终可用，模型不可用时自动回退。
5. **留痕**：每次提问都会写入审计日志（模块「AI 助手」），记录问题、回答摘要、来源
   （`queryAttendance` / `deepseek-flash` / `rule`）与耗时，在 `/rzgl/` 可查、可导出。
   实现见 `api/ai.ts` 的 `$aiAuditPost` 与 `router.ts` 的 `/ai/audit`。

---

## 五、验证方式

```bash
# 代理契约（假上游 + 断言 Header 注入）
pnpm test:ai-proxy

# 浏览器侧
pnpm dev
# /ai/ 依次问：有多少学生请假待审批 / 本周考勤怎么样 / 高一(1)班成绩分析
# 预期分别命中 queryLeave / queryAttendance / queryScores
```
