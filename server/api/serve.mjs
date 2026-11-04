/**
 * 智慧校园 API 服务
 * @desc 直接复用前端 mock 的路由表（server/dist/api.mjs 由 `pnpm build:server` 生成），
 *       因此业务逻辑只有一份，前端 VITE_USE_MOCK=false 即可切到本服务。
 *
 * 启动：pnpm build:server && pnpm start:server
 * 约定：响应统一 { status, result, msg }；与 mock adapter 完全一致。
 */
import { createServer } from "node:http";
import { mockRoutes } from "../dist/api.mjs";

const PORT = Number(process.env.API_PORT || 3001);
const HOST = process.env.API_HOST || "0.0.0.0";

/** 去掉域名、/api 前缀与查询串，与 mock adapter 保持一致 */
const normalize = url =>
	(url || "")
		.split("?")[0]
		.replace(/^https?:\/\/[^/]+/, "")
		.replace(/^\/api/, "");

const send = (res, body, code = 200) => {
	res.writeHead(code, { "content-type": "application/json; charset=utf-8" });
	res.end(JSON.stringify(body));
};

const readBody = req =>
	new Promise(resolve => {
		const chunks = [];
		req.on("data", c => chunks.push(c));
		req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
		req.on("error", () => resolve(""));
	});

const server = createServer(async (req, res) => {
	// CORS：允许前端跨域直连（走 vite 代理时其实用不到，但便于单独调试）
	res.setHeader("access-control-allow-origin", req.headers.origin || "*");
	res.setHeader("access-control-allow-credentials", "true");
	res.setHeader("access-control-allow-headers", "content-type,authorization,x-requested-with");
	res.setHeader("access-control-allow-methods", "GET,POST,PUT,DELETE,OPTIONS");

	if (req.method === "OPTIONS") {
		res.writeHead(204);
		return res.end();
	}

	const started = Date.now();
	const url = normalize(req.url);
	const method = (req.method || "GET").toUpperCase();

	if (url === "/health") {
		return send(res, { status: true, result: { ok: true, routes: mockRoutes.length, uptime: process.uptime() }, msg: "" });
	}

	let params = {};
	if (method === "GET") {
		const query = new URL(req.url || "/", "http://localhost").searchParams;
		params = Object.fromEntries(query.entries());
	} else {
		const raw = await readBody(req);
		if (raw) {
			try {
				params = JSON.parse(raw);
			} catch {
				params = {};
			}
		}
	}

	const route = mockRoutes.find(r =>
		r.method === method && (typeof r.match === "string" ? url.startsWith(r.match) : r.match.test(url))
	);

	let body;
	if (route) {
		try {
			body = route.handler({ params, url, method });
		} catch (e) {
			body = { status: false, code: 500, msg: `服务处理异常：${e?.message || e}`, result: null };
		}
	} else {
		body = { status: false, code: 404, msg: `接口不存在：${method} ${url}`, result: null };
	}

	// 访问日志（精简一行）
	console.log(`${method} ${url} -> ${body?.status ? "ok" : `fail(${body?.code || "-"})`} ${Date.now() - started}ms`);

	send(res, body);
});

server.listen(PORT, HOST, () => {
	console.log(`[api] listening on http://${HOST}:${PORT}  (${mockRoutes.length} routes)`);
	console.log("[api] 数据存放在内存中，重启即恢复初始状态；接数据库时替换 mock/db 与各数据集合即可");
});
