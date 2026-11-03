<!-- 虚拟滚动列表：仅渲染可视区域，用于上千行数据 -->
<template>
	<div ref="wrapRef" class="n-virtual-list" @scroll="onScroll">
		<div class="n-virtual-list__phantom" :style="{ height: `${totalHeight}px` }"></div>
		<div class="n-virtual-list__body" :style="{ transform: `translateY(${offsetY}px)` }">
			<div
				v-for="row in visibleRows"
				:key="row.__key"
				class="n-virtual-list__row"
				:style="{ height: `${itemHeight}px` }"
			>
				<slot :item="row.item" :index="row.__index"></slot>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

const props = withDefaults(
	defineProps<{
		items?: any[];
		itemHeight?: number;
		/** 上下缓冲行数 */
		buffer?: number;
	}>(),
	{ items: () => [], itemHeight: 40, buffer: 6 }
);

const wrapRef = ref<HTMLElement>();
const scrollTop = ref(0);
const viewportHeight = ref(400);

const totalHeight = computed(() => props.items.length * props.itemHeight);

const startIndex = computed(() => Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - props.buffer));
const endIndex = computed(() =>
	Math.min(props.items.length, Math.ceil((scrollTop.value + viewportHeight.value) / props.itemHeight) + props.buffer)
);

const offsetY = computed(() => startIndex.value * props.itemHeight);

const visibleRows = computed(() =>
	props.items.slice(startIndex.value, endIndex.value).map((item, i) => ({
		item,
		__index: startIndex.value + i,
		__key: `${startIndex.value + i}`
	}))
);

const onScroll = () => {
	if (wrapRef.value) scrollTop.value = wrapRef.value.scrollTop;
};

const measure = () => {
	if (wrapRef.value) viewportHeight.value = wrapRef.value.clientHeight || 400;
};

onMounted(() => {
	measure();
	window.addEventListener("resize", measure);
});
</script>

<style lang="less">
.n-virtual-list {
	position: relative;
	flex: 1;
	min-height: 0;
	overflow: auto;

	&__phantom {
		width: 100%;
		pointer-events: none;
	}

	&__body {
		position: absolute;
		left: 0;
		right: 0;
		top: 0;
		will-change: transform;
	}

	&__row {
		display: flex;
		align-items: center;
		border-bottom: 1px solid var(--sc-border);
		font-size: 13px;
		color: var(--sc-text-2);

		&:hover {
			background: var(--sc-bg);
		}
	}
}
</style>
