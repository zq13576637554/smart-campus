<!-- 面包屑 -->
<template>
	<div class="bread-crumb">
		<span class="bread-crumb__item" @click="router.push('/home/')">{{ t("首页") }}</span>
		<template v-for="(item, index) in crumbs" :key="item.path">
			<span class="bread-crumb__sep">/</span>
			<span
				class="bread-crumb__item"
				:class="{ 'is-current': index === crumbs.length - 1 }"
			>{{ item.title }}</span>
		</template>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { t, tg, tm } from "lmLibs/i18n";

const route = useRoute();
const router = useRouter();

const crumbs = computed(() => {
	const meta = route.meta as any;
	const list: { title: string; path: string }[] = [];
	if (meta.group) list.push({ title: tg(meta.group), path: "" });
	if (meta.zhTitle && meta.zhTitle !== "首页") {
		list.push({ title: tm(route.path, meta.zhTitle), path: route.path });
	}
	return list;
});
</script>

<style lang="less">
.bread-crumb {
	display: flex;
	align-items: center;
	font-size: 13px;
	color: #86909c;

	&__item {
		cursor: pointer;

		&:hover {
			color: #165dff;
		}

		&.is-current {
			color: #1d2129;
			cursor: default;
		}
	}

	&__sep {
		margin: 0 6px;
		color: #c9cdd4;
	}
}
</style>
