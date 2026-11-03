/**
 * AI 代理中间件
 * @desc 把浏览器请求转发到真实模型服务，并在服务端注入 API Key —— **密钥永远不进前端包**。
 *       可挂到 Vite dev server（开发），也可独立起服务（生产）。
 *
 * 环境变量：
 *   AI_UPSTREAM_BASE  上游地址，如 https://api.openai.com/v1 或 http://127.0.0.1:11434
 *   AI_API_KEY        上游密钥（本地 Ollama 可留空）
 *   AI_MODEL          默认模型名
 */

export function createAiProxy(options = {}) {
	const prefix = options.prefix || "/ai-proxy";
	const upstreamBase = (options.upstreamBase || process.env.AI_UPSTREAM_BASE || "").replace(/\/$/, "");
	const apiKey = options.apiKey ?? process.env.AI_API_KEY ?? "";
	const model = options.model || process.env.AI_MODEL || "gpt-4o-mini";

	/**
	 * @returns {Promise<boolean>} 是否已处理该请求
	 */
	return async function aiProxy(req, res) {
		if (!req.url || !req.url.startsWith(prefix)) return false;

		if (!upstreamBase) {
			res.statusCode = 503;
			res.setHeader("content-type", "application/json; charset=utf-8");
			res.end(JSON.stringify({ error: { message: "未配置 AI_UPSTREAM_BASE" } }));
			return true;
		}

		// 读取请求体
		const chunks = [];
		for await (const chunk of req) chunks.push(chunk);
		const raw = Buffer.concat(chunks).toString("utf8");

		let body = {};
		try {
			body = raw ? JSON.parse(raw) : {};
		} catch {
			body = {};
		}
		body.model = body.model || model;

		const path = req.url.slice(prefix.length) || "/chat/completions";
		const target = `${upstreamBase}${path}`;

		const headers = { "content-type": "application/json" };
		if (apiKey) headers.authorization = `Bearer ${apiKey}`;
		if (options.extraHeaders) Object.assign(headers, options.extraHeaders);

		try {
			const upstream = await fetch(target, {
				method: "POST",
				headers,
				body: JSON.stringify(body)
			});

			res.statusCode = upstream.status;
			res.setHeader("content-type", upstream.headers.get("content-type") || "application/json; charset=utf-8");

			if (upstream.body) {
				const reader = upstream.body.getReader();
				// 逐块转发，兼容 SSE 流式输出
				for (;;) {
					const { done, value } = await reader.read();
					if (done) break;
					res.write(Buffer.from(value));
				}
			}
			res.end();
		} catch (e) {
			res.statusCode = 502;
			res.setHeader("content-type", "application/json; charset=utf-8");
			res.end(JSON.stringify({ error: { message: `AI 代理请求失败：${e.message}` } }));
		}

		return true;
	};
}

/** 独立服务模式：node server/ai-proxy.mjs */
export function startStandalone(port = Number(process.env.AI_PROXY_PORT || 8787)) {
	return import("node:http").then(({ createServer }) => {
		const handle = createAiProxy({ prefix: "/" });
		const server = createServer(async (req, res) => {
			const handled = await handle(req, res);
			if (!handled) {
				res.statusCode = 404;
				res.end("not found");
			}
		});
		server.listen(port, () => {
			console.log(`[ai-proxy] listening on http://127.0.0.1:${port} -> ${process.env.AI_UPSTREAM_BASE || "(未配置上游)"}`);
		});
		return server;
	});
}
