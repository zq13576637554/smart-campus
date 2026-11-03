import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, URL } from "node:url";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/** 共享包别名：与 rs.ict-saas 的 lm 前缀导入约定保持一致 */
const lm = (prefix: string, dir: string) => [
	{ find: new RegExp(`^${prefix}$`), replacement: r(dir) },
	{ find: new RegExp(`^${prefix}/`), replacement: `${r(dir)}/` }
];

/**
 * 业务模块别名
 * @desc lmAppsCampusMdusXsgl/routes => packages/apps/campus/mdus/xsgl/routes.ts
 *       替代 rs.ict-saas 中由 @fy/plug-wmf 自动注入的模块联邦远程入口
 */
const mduAlias = {
	name: "campus-mdu-alias",
	enforce: "pre" as const,
	resolveId(source: string) {
		const matched = source.match(/^lmAppsCampusMdus([A-Za-z0-9]+)(?:\/(.*))?$/);
		if (!matched) return null;
		const mdu = matched[1].toLowerCase();
		const sub = matched[2] || "index";
		const base = path.resolve(r("./packages/apps/campus/mdus"), mdu, sub);
		const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.vue`, `${base}/index.ts`, `${base}/index.vue`];
		const hit = candidates.find(p => existsSync(p) && !p.endsWith("/"));
		return hit || null;
	}
};

/**
 * AI 代理
 * @desc 开发期把 /ai-proxy/* 转发到真实模型服务，密钥只在服务端（.env.local → 进程内）
 */
const aiProxyPlugin = (env: Record<string, string>) => ({
	name: "campus-ai-proxy",
	configureServer(server: any) {
		let handler: any = null;
		server.middlewares.use(async (req: any, res: any, next: any) => {
			if (!req.url?.startsWith("/ai-proxy")) return next();
			if (!handler) {
				const mod = await import("./server/ai-proxy.mjs");
				handler = mod.createAiProxy({
					upstreamBase: env.AI_UPSTREAM_BASE,
					apiKey: env.AI_API_KEY,
					model: env.AI_MODEL
				});
			}
			const handled = await handler(req, res);
			if (!handled) next();
		});
	}
});

export default defineConfig(({ mode }) => {
	// 第三个参数传空串：连同非 VITE_ 前缀的变量一起读进来（仅在此处使用，不会打进前端包）
	const env = loadEnv(mode, process.cwd(), "");

	return {
		plugins: [aiProxyPlugin(env), mduAlias, vue()],
		resolve: {
			alias: [
				...lm("lmUtils", "./packages/utils"),
				...lm("lmLibs", "./packages/libs"),
				...lm("lmStore", "./packages/store"),
				...lm("lmHooks", "./packages/hooks"),
				...lm("lmIreposC", "./packages/irepos/c"),
				...lm("lmIreposF", "./packages/irepos/f"),
				...lm("lmCmpsBasic", "./packages/cmps/basic"),
				...lm("lmCmpsBiz", "./packages/cmps/biz"),
				...lm("lmCmpsLayout", "./packages/cmps/layout"),
				...lm("lmCmpsEcharts", "./packages/cmps/echarts"),
				...lm("lmApisCampus", "./packages/apis/campus"),
				...lm("lmPureai", "./packages/pureai"),
				...lm("lmAppsCampusEntry", "./packages/apps/campus/entry"),
				{ find: /^@\//, replacement: `${r("./packages/apps/campus/entry")}/` }
			]
		},
		css: {
			preprocessorOptions: {
				less: { javascriptEnabled: true }
			}
		},
		server: {
			host: "0.0.0.0",
			port: 8080,
			open: false
		},
		build: {
			outDir: "dist",
			chunkSizeWarningLimit: 1024,
			rollupOptions: {
				output: {
					/** 拆出稳定的第三方 chunk，业务代码变更不影响其缓存 */
					manualChunks(id: string) {
						if (!id.includes("node_modules")) return;
						if (id.includes("echarts") || id.includes("zrender")) return "vendor-echarts";
						if (id.includes("element-plus") || id.includes("@element-plus")) return "vendor-element";
						if (/node_modules\/(@vue|vue|vue-router|pinia|@vueuse)/.test(id)) return "vendor-vue";
					}
				}
			}
		}
	};
});
