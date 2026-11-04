import { defineConfig, mergeConfig } from "vite";
import baseConfig from "./vite.config";

/**
 * 后端构建
 * @desc 把 mock 路由表（含其依赖的 db / 数据集合 / 业务函数）打成单个 ESM，
 *       由 server/api/serve.mjs 加载，从而复用同一份业务逻辑。
 */
export default defineConfig(async env => {
	const base = typeof baseConfig === "function" ? await (baseConfig as any)({ mode: "production", command: "build", ...env }) : baseConfig;

	return mergeConfig(base as any, {
		build: {
			ssr: "server/api/entry.ts",
			outDir: "server/dist",
			emptyOutDir: true,
			target: "node20",
			minify: false,
			rollupOptions: {
				output: {
					entryFileNames: "api.mjs"
				}
			}
		}
	});
});
