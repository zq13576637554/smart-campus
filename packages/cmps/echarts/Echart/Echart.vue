<!-- ECharts 容器：按需注册图表、自动 resize、自适应暗色 -->
<template>
	<div ref="elRef" class="n-echart" :style="{ height: typeof height === 'number' ? `${height}px` : height }"></div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import * as echarts from "echarts/core";
import { BarChart, LineChart, PieChart } from "echarts/charts";
import { DatasetComponent, GridComponent, LegendComponent, TitleComponent, TooltipComponent } from "echarts/components";
import { LabelLayout, UniversalTransition } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";
import type { EChartsType } from "echarts/core";

// 按需注册：只引入项目实际用到的图表与组件，避免全量引入（约省 700KB）
echarts.use([
	BarChart,
	LineChart,
	PieChart,
	GridComponent,
	TooltipComponent,
	LegendComponent,
	TitleComponent,
	DatasetComponent,
	LabelLayout,
	UniversalTransition,
	CanvasRenderer
]);

const props = withDefaults(
	defineProps<{
		option?: Record<string, any>;
		height?: number | string;
		/** 是否不合并 option */
		notMerge?: boolean;
	}>(),
	{ option: () => ({}), height: 320, notMerge: false }
);

const elRef = ref<HTMLElement>();
const chart = shallowRef<EChartsType>();
const isDark = ref(document.documentElement.classList.contains("dark"));
let resizeObserver: ResizeObserver | null = null;
let themeObserver: MutationObserver | null = null;

/** 叠加主题基础样式（暗色下文字颜色跟随） */
const finalOption = computed(() => ({
	backgroundColor: "transparent",
	textStyle: { color: isDark.value ? "#a9b8d4" : "#4e5969" },
	...props.option
}));

const render = () => {
	if (!chart.value) return;
	chart.value.setOption(finalOption.value, props.notMerge);
};

onMounted(() => {
	if (!elRef.value) return;
	chart.value = echarts.init(elRef.value);
	render();

	resizeObserver = new ResizeObserver(() => chart.value?.resize());
	resizeObserver.observe(elRef.value);

	// 监听 html.dark 变化，自动重绘
	themeObserver = new MutationObserver(() => {
		const next = document.documentElement.classList.contains("dark");
		if (next === isDark.value) return;
		isDark.value = next;
		render();
	});
	themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
});

watch(() => props.option, render, { deep: true });

onBeforeUnmount(() => {
	resizeObserver?.disconnect();
	themeObserver?.disconnect();
	chart.value?.dispose();
});

defineExpose({ chart, getInstance: () => chart.value });
</script>

<style lang="less">
.n-echart {
	width: 100%;
	min-height: 160px;
}
</style>
