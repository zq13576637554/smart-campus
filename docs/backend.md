# 后端服务

项目自带一个可运行的 HTTP 后端，**与前端 mock 共用同一份业务逻辑**，不存在两套实现漂移。

## 一、为什么是「复用」而不是「重写」

`packages/apis/campus/mock/router.ts` 里的 131 条路由本身就是纯函数：

```ts
{ method: "POST", match: "/student/page", handler: ({ params }) => ok(...) }
```

没有 DOM 依赖，只用到 `dayjs` 与数据集合。于是后端只需要：

1. 用 `vite.server.config.ts` 把这套路由（连同 `db` / `extra` / `extra2` 等）打成 `server/dist/api.mjs`
2. 用 `server/api/serve.mjs` 起一个 Node HTTP 服务，按 `method + url` 分发到同一个 `mockRoutes`

好处：mock 里改一条业务规则，前后端同时生效；反之亦然。

## 二、启动

```bash
pnpm build:server     # 打包后端（产出 server/dist/api.mjs）
pnpm start:server     # 默认 0.0.0.0:3001
```

环境变量：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `API_PORT` | `3001` | 监听端口 |
| `API_HOST` | `0.0.0.0` | 监听地址 |

健康检查：

```bash
curl http://127.0.0.1:3001/health
# {"status":true,"result":{"ok":true,"routes":131,"uptime":6},"msg":""}
```

## 三、前端切换到真实后端

```bash
# .env.local
VITE_USE_MOCK=false
```

dev server 已配置代理：`/api` → `http://127.0.0.1:3001`（可用 `API_PROXY_TARGET` 覆盖）。
业务代码零改动——`http.ts` 只是不再挂 mock adapter。

独立部署（前后端不同域）时：

```bash
VITE_USE_MOCK=false
VITE_API_BASE=https://api.example.com/api/
```

服务端已开启 CORS。

## 四、接口约定

统一信封，与 mock 完全一致：

```json
{ "status": true, "result": {}, "msg": "" }
```

失败时 `status: false` + `code` + `msg`；前端 `serviceMid` 拦截器负责提示与 401 跳转。

主要接口分组（共 131 条）：

| 前缀 | 数量 | 说明 |
| --- | --- | --- |
| `/auth/*` | 6 | 登录、用户信息、菜单、校区、登出 |
| `/common/*` | 2 | 字典枚举 |
| `/student/*` `/teacher/*` `/class/*` `/course/*` `/schedule/*` | 20+ | 学籍与教学 |
| `/attendance/*` `/score/*` `/exam/*` `/enrollment/*` | 15+ | 考勤、成绩、考试、选课 |
| `/dorm/*` `/card/*` `/access/*` `/notice/*` `/leave/*` | 20+ | 校园生活 |
| `/repair/*` `/alert/*` `/visitor/*` `/bill/*` `/asset/*` `/library/*` `/bus/*` `/energy/*` | 20+ | 后勤与资产 |
| `/dashboard/*` `/report/*` `/audit/*` `/message/*` `/todo/*` `/data/*` | 20+ | 平台能力 |
| `/ai/*` | 8 | Copilot、知识库、学情、周报、报表解读、工具执行 |

完整清单见 `packages/apis/campus/mock/router.ts`。

## 五、数据存储

当前数据在**进程内存**中，重启即恢复初始状态（与前端 mock 行为一致）。

接真实数据库时，改动面很小——所有读写都集中在两个地方：

1. `packages/apis/campus/mock/db.ts` —— 学生 / 教师 / 课程 / 考勤 / 成绩 / 宿舍 / 一卡通等集合
2. `packages/apis/campus/mock/extra.ts`、`extra2.ts` —— 请假 / 报修 / 访客 / 账单 / 资产 / 图书 / 班车 / 能耗等

把这两个文件的「内存数组」换成 ORM 查询即可，路由层不用动。

## 六、生产部署建议

```bash
# 1. 构建
pnpm build            # 前端 -> dist/
pnpm build:server     # 后端 -> server/dist/api.mjs

# 2. 进程守护
pm2 start server/api/serve.mjs --name campus-api

# 3. nginx：静态资源 + 反代
#   location /        { root /path/to/dist; try_files $uri $uri/ /index.html; }
#   location /api/    { proxy_pass http://127.0.0.1:3001; }
```

注意：

- 服务返回的是业务信封而非 HTTP 状态码（与 mock 一致），网关日志里看 `msg` 判断成败
- 生产务必在网关层加鉴权与限流，当前 `Authorization` 仅做透传
- 数据库接入前，重启服务会丢数据

## 七、验证记录

| 项 | 结果 |
| --- | --- |
| `/health` | 200，131 条路由 |
| `POST /auth/login` | 返回 token + userInfo（含 authCodes） |
| `POST /student/page` | 399 条，分页正常 |
| `GET /auth/menus` | 34 个分组 |
| 不存在路径 | 返回 `status:false, code:404` |
| 前端 `VITE_USE_MOCK=false` | 登录、首页、学生档案、待办中心全部正常，控制台 0 错误 |
