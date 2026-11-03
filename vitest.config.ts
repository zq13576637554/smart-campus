import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/** 与 vite.config.ts 保持一致的 lm 前缀别名（仅测试需要的部分） */
const lm = (prefix: string, dir: string) => [
	{ find: new RegExp(`^${prefix}$`), replacement: r(dir) },
	{ find: new RegExp(`^${prefix}/`), replacement: `${r(dir)}/` }
];

export default defineConfig({
	resolve: {
		alias: [
			...lm("lmUtils", "./packages/utils"),
			...lm("lmLibs", "./packages/libs"),
			...lm("lmApisCampus", "./packages/apis/campus"),
			...lm("lmStore", "./packages/store"),
			...lm("lmHooks", "./packages/hooks")
		]
	},
	test: {
		environment: "node",
		include: ["tests/**/*.test.ts"],
		reporters: ["default"]
	}
});
