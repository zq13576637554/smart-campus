<!-- 基础页面模板：搜索 + 列表（对应 lmCmpsBiz/NPageBasic） -->
<template>
	<section class="n-page-basic">
		<div v-if="$slots['left-tree']" class="n-page-basic__tree">
			<slot name="left-tree"></slot>
		</div>

		<div class="n-page-basic__content">
			<NSummaryCard v-if="showSummaryCard && summaryData.length" :summary-data="summaryData" />

			<QueryView
				v-if="_bars?.length"
				ref="qvRef"
				:data="_bars"
				:hide-bar="hideBar"
				:loading="loading"
				:is-show-more-filter="isShowMoreFilter"
				:fixed-show-item-len="fixedShowItemLen"
				:columns="barColumns"
				:show-ai-query="aiQuery"
				:do-search="doSearch"
				@on-query="onQuery"
				@reset="onReset"
				@ai-query="aiVisible = true"
				@on-event-watch="args => $emit('onQueryEventWatch', args)"
			/>

			<Tb
				ref="tbRef"
				class="n-page-basic__tb"
				:fetch="apiFn"
				:cols="cols"
				:title="title"
				:row-key="rowKey"
				:stripe="stripe"
				:open-col-setting="openColSetting"
				:transform-records="transformRecords"
				:cell-class-name="cellClassName"
				:tb-props="tbProps"
				:show-pagination="showPagination"
				@register="register"
				@on-event-watch="onTbEventWatch"
				@selection-change="val => $emit('selection-change', val)"
				@row-click="(...args) => $emit('row-click', ...args)"
				@loaded="onLoaded"
			>
				<template v-if="$slots['tb-title']" #title>
					<slot name="tb-title"></slot>
				</template>
				<template #buttons>
					<slot name="handle-buttons"></slot>
				</template>
				<template v-if="$slots['tb-expand']" #expand="{ data }">
					<slot name="tb-expand" :data="data"></slot>
				</template>
			</Tb>

			<slot></slot>
		</div>

		<!-- 智能查询：自然语言 → 查询条件 -->
		<AiQuery v-model="aiVisible" :schema="aiSchema" @apply="onAiApply" />
	</section>
</template>

<script setup lang="ts">
import { computed, onActivated, ref } from "vue";
import QueryView from "lmCmpsBasic/QueryView";
import Tb from "lmCmpsBasic/Tb";
import NSummaryCard from "lmCmpsBasic/NSummaryCard";
import AiQuery from "lmCmpsBiz/AiQuery";
import { useTb } from "lmHooks/cmps/useTb";
import { useDict } from "lmHooks/tools/useDict";
import { buildAiSchema, normalizeBarItems } from "./aiSchema";
import { backPageDoEvent } from "lmUtils/eventBus";
import { dayjs } from "lmUtils/time";

const props = withDefaults(
	defineProps<{
		title?: string;
		/** 列表接口 */
		api?: (params: Record<string, any>, type?: string) => Promise<any>;
		/** 查询前处理参数 */
		beforeQuery?: (query: Record<string, any>) => any;
		/** 请求前处理参数 */
		beforeFetch?: (params: Record<string, any>) => any;
		transformRecords?: (list: any[]) => any[];
		cellClassName?: (data: any) => string;
		cols?: any[];
		/** 查询条件：扁平数组或 [{items}] */
		bars?: any[];
		stripe?: boolean;
		rowKey?: string;
		rowId?: string;
		rowIdName?: string;
		openColSetting?: boolean;
		showPagination?: boolean;
		tbProps?: Record<string, any>;
		hideBar?: boolean;
		isShowMoreFilter?: boolean;
		fixedShowItemLen?: number;
		/** 查询栏列数 */
		barColumns?: number;
		/** 是否展示智能查询入口 */
		aiQuery?: boolean;
		showSummaryCard?: boolean;
		summaryData?: any[];
		/** 额外的固定查询参数 */
		paramsQuery?: Record<string, any>;
	}>(),
	{
		title: "",
		api: undefined,
		beforeQuery: undefined,
		beforeFetch: undefined,
		transformRecords: undefined,
		cellClassName: undefined,
		cols: () => [],
		bars: () => [],
		stripe: true,
		rowKey: "id",
		rowId: "",
		rowIdName: "",
		openColSetting: true,
		showPagination: true,
		tbProps: () => ({}),
		hideBar: false,
		isShowMoreFilter: false,
		fixedShowItemLen: undefined,
		barColumns: 4,
		aiQuery: true,
		showSummaryCard: false,
		summaryData: () => [],
		paramsQuery: () => ({})
	}
);

const emit = defineEmits<{
	(e: "selection-change", rows: any[]): void;
	(e: "row-click", ...args: any[]): void;
	(e: "onQueryEventWatch", args: any): void;
	(e: "onTbEventWatch", args: any): void;
	(e: "loaded", payload: any): void;
	(e: "getUnitId", ...args: any[]): void;
}>();

const { register, doSearch, tbRef } = useTb();
const qvRef = ref();
const loading = ref(false);
const summaryInner = ref<any[]>([]);
const aiVisible = ref(false);
const { dictOptions } = useDict();

/** 由查询栏配置推导「智能查询」可识别的字段 */
const aiSchema = computed(() => buildAiSchema(normalizeBarItems(_bars.value), dictOptions));

/** 应用智能查询条件：回填查询栏并触发查询 */
const onAiApply = (filters: Record<string, any>) => {
	qvRef.value?.setQueryData?.(filters);
	qvRef.value?.onSearch?.();
};

const _bars = computed(() => {
	const bars = props.bars || [];
	return bars.length && bars[0]?.items ? bars : bars.length ? [{ items: bars }] : [];
});

const summaryData = computed(() => (props.summaryData?.length ? props.summaryData : summaryInner.value));

const setBars = (bars: any[]) => {
	// 通过重渲染实现：父组件传入新的 bars 即可，保留方法以兼容
	return bars;
};

/** 查询区参数 */
const queryData = ref<Record<string, any>>({});

const onQuery = async (query: Record<string, any>) => {
	queryData.value = typeof props.beforeQuery === "function" ? await props.beforeQuery(query) : query;
	doSearch(false, "search");
};

const onReset = () => {
	queryData.value = {};
	doSearch(false, "reset");
};

/** 时间区间参数拆分：createAt -> startCreateAt / endCreateAt */
const formatDatetimerange = (param: Record<string, any>) => {
	const items = _bars.value?.[0]?.items || [];
	items
		.filter((t: any) => ["datetimerange", "daterange"].includes(t?.props?.type))
		.forEach((t: any) => {
			const { key, props: barProps } = t;
			const startKey = barProps?.startKey || `${key}Start`;
			const endKey = barProps?.endKey || `${key}End`;
			const times = param?.[key] || [];
			param[startKey] = times[0];
			param[endKey] = times[1];
			delete param[key];
			!param[startKey] && delete param[startKey];
			!param[endKey] && delete param[endKey];
		});
	return param;
};

/** 枚举「全部」占位值处理 */
const formatEnumSelect = (param: Record<string, any>) => {
	const items = _bars.value?.[0]?.items || [];
	items
		.filter((t: any) => t?.type === "enumSelect")
		.forEach((t: any) => {
			const { key, props: barProps } = t;
			if (param[key] === "-1") param[key] = barProps?.defaultValue;
		});
	return param;
};

/** 表格接口 */
const apiFn = async (params: Record<string, any>, type?: string) => {
	let param: Record<string, any> = { ...params, ...props.paramsQuery, ...queryData.value };
	param = formatEnumSelect(formatDatetimerange(param));
	if (typeof props.beforeFetch === "function") param = await props.beforeFetch(param);
	if (typeof props.api !== "function") return [];
	loading.value = true;
	try {
		return await props.api(param, type);
	} finally {
		loading.value = false;
	}
};

const onTbEventWatch = (args: Record<string, any>) => emit("onTbEventWatch", args);

const onLoaded = (payload: any) => emit("loaded", payload);

/** 页面返回时按事件类型刷新 */
onActivated(() => {
	backPageDoEvent(msg => {
		if (msg.type === "edit-success") doSearch(true, "search");
		if (msg.type === "create-success") doSearch(false, "search");
	});
});

const getQueryData = () => qvRef.value?.getQueryData?.() || {};

defineExpose({
	tbRef,
	doSearch,
	qvRef,
	setBars,
	getQueryData,
	getTbRef: () => tbRef.value,
	getqyRef: () => qvRef.value,
	updateSummaryData: (data: any[]) => (summaryInner.value = data)
});
</script>

<style lang="less">
.n-page-basic {
	display: flex;
	gap: 12px;
	height: 100%;
	min-height: 0;
	min-width: 0;

	&__tree {
		flex: 0 0 240px;
		background: var(--sc-card);
		border-radius: 8px;
		padding: 12px;
		overflow: auto;
	}

	&__content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 12px;
		min-width: 0;
		min-height: 0;
	}

	&__tb {
		flex: 1;
		min-height: 0;
		min-width: 0;
	}
}
</style>
