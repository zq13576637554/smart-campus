#!/usr/bin/env node
/**
 * 业务模块脚手架
 * @desc 对应 rs.ict-saas 的 `npx fy wmf add <app> -m <module> -v <page>`
 *
 * 用法：
 *   pnpm create:module xsgl2 学生档案
 *   node scripts/create-module.mjs <mdu> <中文标题> [分组] [图标]
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const [mdu, title, group = "其他", icon = "grid"] = process.argv.slice(2);

if (!mdu || !title) {
	console.error("用法：node scripts/create-module.mjs <mdu> <中文标题> [分组] [图标]");
	process.exit(1);
}

const root = resolve(process.cwd());
const dir = join(root, "packages/apps/campus/mdus", mdu);

if (existsSync(dir)) {
	console.error(`模块已存在：${dir}`);
	process.exit(1);
}

const camel = mdu.charAt(0).toUpperCase() + mdu.slice(1);
const name = `apps_campus_mdus_${mdu}`;

mkdirSync(join(dir, "views/Index"), { recursive: true });

writeFileSync(
	join(dir, "package.json"),
	JSON.stringify(
		{
			name,
			description: `${title}模块`,
			private: true,
			mdu: { path: `/${mdu}/`, title }
		},
		null,
		"\t"
	) + "\n",
	"utf8"
);

writeFileSync(
	join(dir, "routes.ts"),
	`export default [
	{
		name: "${mdu}Index",
		path: "/${mdu}/",
		component: () => import("./views/Index/index.vue"),
		meta: {
			title: "${mdu}Index",
			zhTitle: "${title}",
			group: "${group}",
			icon: "${icon}",
			sort: 99
		}
	}
];
`,
	"utf8"
);

writeFileSync(
	join(dir, "views/Index/index.vue"),
	`<!-- ${title} -->
<template>
	<NPageBasic
		ref="pageRef"
		class="campus-${mdu}-index"
		title="${title}"
		row-key="id"
		:bars="bars"
		:cols="cols"
		:api="fetchData"
		@on-tb-event-watch="onTbAction"
	>
		<template #handle-buttons>
			<ElButton type="primary" @click="onCreate">新增</ElButton>
		</template>
	</NPageBasic>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ElButton, ElMessage } from "lmLibs/element-plus";
import NPageBasic from "lmCmpsBiz/NPageBasic";
import { useSimpleCols } from "lmHooks/tools/useCols";
import { useSimpleBars } from "lmHooks/tools/useBars";
import { sync } from "lmUtils/promise";

const pageRef = ref();

/** 查询条件：标题|字段|组件-参数 */
const bars = computed(() =>
	useSimpleBars([
		"名称|name|input"
	])
);

/** 表格列：标题|字段|渲染器-参数 */
const cols = computed(() =>
	useSimpleCols([
		"idx",
		"名称|name|minWidth:140",
		"创建时间|createdAt|minWidth:170",
		{ col: "actions|查看:view", setComProps: { fixed: "right", minWidth: 100 } }
	])
);

/** 列表接口 */
const fetchData = async (params: Record<string, any>) => {
	const [err, res] = await sync(Promise.resolve({ content: [], total: 0 }));
	return err ? { content: [], total: 0 } : res;
};

const onCreate = () => ElMessage.info("请实现新增逻辑");

const onTbAction = ({ key, data }: any) => {
	if (key === "view") ElMessage.info(\`查看 \${data?.data?.row?.name}\`);
};
</script>
`,
	"utf8"
);

console.log(`✓ 已创建模块：packages/apps/campus/mdus/${mdu}`);
console.log("  下一步：");
console.log(`    1) 在 vite.config.ts / tsconfig.json 中补充路径别名 lmAppsCampusMdus${camel}`);
console.log("    2) 执行 pnpm gen:routes 重新生成路由注册表");
