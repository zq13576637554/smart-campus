/**
 * AI 代理契约检查
 * @desc 起一个假上游 + 代理，断言：转发成功、服务端注入了密钥、未配置上游时返回 503。
 *       用法：pnpm test:ai-proxy
 */
import { createServer } from "node:http";
import { createAiProxy } from "../server/ai-proxy.mjs";

const listen = (server, port) => new Promise(resolve => server.listen(port, "127.0.0.1", resolve));
const close = server => new Promise(resolve => server.close(resolve));

let seenAuth = "";

const upstream = createServer((req, res) => {
	seenAuth = req.headers.authorization || "";
	req.on("data", () => {});
	req.on("end", () => {
		res.setHeader("content-type", "application/json");
		res.end(JSON.stringify({ choices: [{ message: { role: "assistant", content: "pong" } }] }));
	});
});
await listen(upstream, 5999);

const proxy = createServer(async (req, res) => {
	const handled = await createAiProxy({
		upstreamBase: "http://127.0.0.1:5999/v1",
		apiKey: "sk-test"
	})(req, res);
	if (!handled) {
		res.statusCode = 404;
		res.end();
	}
});
await listen(proxy, 5998);

const noUpstream = createServer(async (req, res) => {
	await createAiProxy({ upstreamBase: "" })(req, res);
});
await listen(noUpstream, 5997);

const results = [];

try {
	const resp = await fetch("http://127.0.0.1:5998/ai-proxy/chat/completions", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ messages: [{ role: "user", content: "ping" }] })
	});
	const data = await resp.json();

	results.push(["转发成功", resp.status === 200]);
	results.push(["内容透传", data?.choices?.[0]?.message?.content === "pong"]);
	results.push(["密钥注入", seenAuth === "Bearer sk-test"]);

	const guard = await fetch("http://127.0.0.1:5997/ai-proxy/chat/completions", { method: "POST", body: "{}" });
	results.push(["未配置上游拦截 503", guard.status === 503]);
} finally {
	await close(upstream);
	await close(proxy);
	await close(noUpstream);
}

let failed = 0;
for (const [name, ok] of results) {
	console.log(`${ok ? "✓" : "✗"} ${name}`);
	if (!ok) failed++;
}
console.log(failed ? `\n代理检查失败：${failed} 项` : "\n代理契约检查通过");
process.exitCode = failed ? 1 : 0;
