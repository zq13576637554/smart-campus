<!-- 业务应用外壳：登录页走裸路由，其它页面套用 Layout -->
<template>
	<template v-if="!isShell">
		<router-view v-slot="{ Component }">
			<component :is="Component" />
		</router-view>
	</template>

	<template v-else>
		<AppLayout :is-collapse="isCollapse" @toggle="toggleMenu">
			<template #logo>
				<Logo :is-collapse="isCollapse" :title="logoTitle" />
			</template>
			<template #menu>
				<Menu :is-collapse="isCollapse" />
			</template>
			<template #header>
				<ToolHeader :is-collapse="isCollapse" @toggle="toggleMenu" />
				<TagViews v-if="isOpenTagViews" />
			</template>

			<router-view v-slot="{ Component, route }">
				<KeepAlive :max="20">
					<component :is="Component" :key="route.name || route.path" />
				</KeepAlive>
			</router-view>

			<!-- 实时事件浮窗 -->
			<RealtimeFeed />
		</AppLayout>
	</template>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import AppLayout from "lmCmpsLayout/AppLayout";
import Logo from "lmCmpsBasic/Logo";
import Menu from "lmCmpsBiz/Menu";
import ToolHeader from "lmCmpsBiz/ToolHeader";
import TagViews from "lmCmpsBiz/TagViews";
import RealtimeFeed from "lmCmpsBiz/RealtimeFeed";
import { useAppStore } from "lmStore/modules/app";

const props = withDefaults(
	defineProps<{
		isOpenTagViews?: boolean;
		logoTitle?: string;
	}>(),
	{ isOpenTagViews: true, logoTitle: "" }
);

const route = useRoute();
const appStore = useAppStore();

// 小屏默认收起侧边栏（抽屉式）
const mobileQuery = typeof window !== "undefined" ? window.matchMedia("(max-width: 1024px)") : null;
const isCollapse = ref(mobileQuery?.matches ?? false);
const toggleMenu = () => (isCollapse.value = !isCollapse.value);

mobileQuery?.addEventListener("change", e => (isCollapse.value = e.matches));

/**
 * 是否显示应用外壳
 * @desc 页面通过 meta.isOpen = true 声明为独立页面（登录、404 等）
 */
const isShell = computed(() => {
	const meta = (route.meta || {}) as any;
	if (!route.name || route.path === "/") return false;
	// fullscreen：全屏页面（数据大屏等）不套外壳
	if (meta.fullscreen) return false;
	return !meta.isOpen;
});

const logoTitle = computed(() => props.logoTitle || appStore.getTenantData?.title || "智慧校园");
</script>
