<!-- 侧边菜单：优先使用后端菜单，未登录/无菜单时回退到路由 meta -->
<template>
	<ElMenu
		:default-active="activePath"
		:collapse="isCollapse"
		:collapse-transition="false"
		background-color="transparent"
		text-color="rgba(255,255,255,0.72)"
		active-text-color="#ffffff"
		class="biz-menu"
		@select="onSelect"
	>
		<template v-for="group in groups" :key="group.name">
			<!-- 有分组 -->
			<ElSubMenu v-if="group.children.length > 1 || group.showGroup" :index="group.name">
				<template #title>
					<NIcon :name="group.icon" :size="17" />
					<span class="biz-menu__label">{{ tg(group.name) }}</span>
				</template>
				<ElMenuItem v-for="item in group.children" :key="item.path" :index="item.path">
					<NIcon :name="item.icon" :size="16" />
					<span class="biz-menu__label">{{ tm(item.path, item.title) }}</span>
				</ElMenuItem>
			</ElSubMenu>

			<!-- 单菜单直接展示 -->
			<ElMenuItem v-else :index="group.children[0]?.path || group.name">
				<NIcon :name="group.children[0]?.icon || group.icon" :size="17" />
				<span class="biz-menu__label">{{ tm(group.children[0]?.path || "", group.children[0]?.title || tg(group.name)) }}</span>
			</ElMenuItem>
		</template>
	</ElMenu>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMenu, ElMenuItem, ElSubMenu } from "lmLibs/element-plus";
import NIcon from "lmCmpsBasic/NIcon";
import { useAppStore } from "lmStore/modules/app";
import { tg, tm } from "lmLibs/i18n";

defineProps<{ isCollapse?: boolean }>();

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();

const activePath = computed(() => route.path);

interface MenuGroup {
	name: string;
	icon?: string;
	showGroup?: boolean;
	children: { path: string; title: string; icon?: string; sort?: number }[];
}

const GROUP_ICON: Record<string, string> = {
	工作台: "grid",
	学籍管理: "student",
	教学管理: "course",
	校园生活: "dorm",
	智能中枢: "ai",
	系统设置: "system"
};

/** 由后端菜单构建（登录后由接口下发，菜单与路由 path 对齐） */
const groups = computed<MenuGroup[]>(() => {
	const menus = appStore.getMenus || [];
	const mduPaths = (appStore.getPathToMdu || []).map(p => p.path);

	/** 只展示已注册模块的菜单项，避免点到尚未实现的页面 */
	const isReady = (path: string) => !mduPaths.length || mduPaths.some(p => path === p || path.startsWith(p));

	if (menus.length) {
		const map = new Map<string, MenuGroup>();
		menus
			.filter((m: any) => !m.hideMenu && (isReady(m.path || "") || m.path === "/home/"))
			.forEach((m: any) => {
				const groupName = m.group || "其他";
				if (!map.has(groupName)) {
					map.set(groupName, { name: groupName, icon: GROUP_ICON[groupName] || "grid", children: [] });
				}
				map.get(groupName)!.children.push({
					path: m.path || m.url,
					title: m.title || m.name,
					icon: m.icon,
					sort: m.sort
				});
			});
		return Array.from(map.values()).map(g => ({
			...g,
			children: g.children.sort((a, b) => (a.sort || 0) - (b.sort || 0))
		}));
	}

	// 回退：由已注册路由的 meta 生成
	const routes = router
		.getRoutes()
		.filter(r => r.meta?.zhTitle && !r.meta?.hideMenu && !r.path.includes(":") && r.path !== "/");

	const map = new Map<string, MenuGroup>();
	routes.forEach(r => {
		const meta = r.meta as any;
		const groupName = meta.group || "其他";
		if (!map.has(groupName)) {
			map.set(groupName, {
				name: groupName,
				icon: GROUP_ICON[groupName] || meta.groupIcon || "grid",
				children: []
			});
		}
		map.get(groupName)!.children.push({ path: r.path, title: meta.zhTitle, icon: meta.icon, sort: meta.sort });
	});

	return Array.from(map.values()).map(g => ({
		...g,
		children: g.children.sort((a, b) => (a.sort || 0) - (b.sort || 0))
	}));
});

const onSelect = (path: string) => {
	if (path !== route.path) router.push(path);
};
</script>

<style lang="less">
.biz-menu {
	border-right: none;
	padding: 0 10px;

	&:not(.el-menu--collapse) {
		width: 100%;
	}

	.el-menu-item,
	.el-sub-menu__title {
		height: 40px;
		line-height: 40px;
		margin: 2px 0;
		padding-left: 12px !important;
		border-radius: 8px;
		font-size: 13.5px;
		transition: background 0.18s ease, color 0.18s ease;

		&:hover {
			background: rgba(255, 255, 255, 0.07) !important;
		}
	}

	.el-menu-item.is-active {
		background: linear-gradient(90deg, #165dff, #3f7bff) !important;
		box-shadow: 0 4px 12px rgba(22, 93, 255, 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.16);
		font-weight: 500;
	}

	.el-sub-menu.is-active > .el-sub-menu__title {
		color: #fff !important;
	}

	.el-sub-menu .el-menu-item {
		height: 36px;
		line-height: 36px;
		margin-left: 8px;
		padding-left: 16px !important;
		font-size: 13px;
	}

	&__label {
		margin-left: 9px;
	}
}
</style>
