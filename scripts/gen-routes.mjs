#!/usr/bin/env node
/**
 * 路由注册表生成器
 * @desc 扫描 packages/apps/campus/mdus/*\/routes.ts，生成入口的模块路由注册表。
 *       对应 rs.ict-saas 中 `npx fy wmf clear` / `--sync-app` 自动维护 entry/routes.ts 的能力。
 *
 * 用法：pnpm gen:routes
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.cwd());
const mdusDir = join(root, "packages/apps/campus/mdus");
const entryFile = join(root, "packages/apps/campus/entry/routes.ts");

const MODULES = readdirSync(mdusDir)
	.filter(name => statSync(join(mdusDir, name)).isDirectory())
	.filter(name => {
		try {
			statSync(join(mdusDir, name, "routes.ts"));
			return true;
		} catch {
			return false;
		}
	})
	.sort();

/** 读取模块首个路由 path */
function firstPath(mdu) {
	const content = readFileSync(join(mdusDir, mdu, "routes.ts"), "utf8");
	const match = content.match(/path:\s*["'`]([^"'`]+)["'`]/);
	return match ? match[1] : `/${mdu}/`;
}

const camel = mdu => mdu.charAt(0).toUpperCase() + mdu.slice(1);

const loaders = MODULES.map(m => `\t${m}: () => import("lmAppsCampusMdus${camel(m)}/routes")`).join(",\n");
const paths = MODULES.map(m => `\t{ path: "${firstPath(m)}", mdu: "${m}" }`).join(",\n");

const content = `/**
 * @file 入口路由注册表（由 scripts/gen-routes.mjs 自动生成，请勿手动修改）
 * @desc 只登记「模块 -> 路由加载器」，模块 routes.ts 在首次访问时按需加载并 addRoute。
 */
import type { Router } from "vue-router";

/** 模块路由加载器（模块联邦的本地等价实现） */
export const mduRoutesLoaders: Record<string, () => Promise<any>> = {
${loaders}
};

/** 模块路径映射：用于「路径 -> 模块」匹配 */
export const pathToMdu: { path: string; mdu: string }[] = [
${paths}
];

const loadedMdus = new Set<string>();

/** 加载模块路由并注册到 router */
export async function ensureMduRoutes(mdu: string, router: Router): Promise<boolean> {
	if (loadedMdus.has(mdu)) return true;
	const loader = mduRoutesLoaders[mdu];
	if (!loader) return false;
	const mod = await loader();
	const list = mod?.default || [];
	(list as any[]).forEach(route => router.addRoute(route));
	loadedMdus.add(mdu);
	return true;
}

/** 静态路由：根路径重定向 */
export default [
	{
		path: "/",
		redirect: "/home/",
		meta: { isOpen: true }
	}
];
`;

writeFileSync(entryFile, content, "utf8");
console.log(`✓ 已生成路由注册表：${MODULES.length} 个模块`);
MODULES.forEach(m => console.log(`  - ${m}  ->  ${firstPath(m)}`));
