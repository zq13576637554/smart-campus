<!-- 查询区：配置驱动的条件栏 -->
<template>
	<div v-if="!hideBar" class="query-view" :class="{ 'is-collapse': isCollapse }">
		<div class="query-view__form" :style="{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }">
			<div v-for="(item, index) in showItems" :key="item.key || index" class="query-view__item">
				<span class="query-view__label">{{ item.label }}</span>
				<component
					:is="resolveType(item.type)"
					v-model="queryData[item.key]"
					class="query-view__control"
					v-bind="bindProps(item)"
					@keyup.enter="onSearch"
				/>
			</div>

			<div class="query-view__actions">
				<ElButton type="primary" :loading="loading" @click="onSearch">
					<ElIcon><Search /></ElIcon>
					查询
				</ElButton>
				<ElButton @click="onReset">
					<ElIcon><RefreshLeft /></ElIcon>
					重置
				</ElButton>
				<ElButton v-if="showAiQuery" link type="primary" class="query-view__ai" @click="$emit('ai-query')">
					<ElIcon><MagicStick /></ElIcon>
					智能查询
				</ElButton>
				<ElButton v-if="canCollapse" link type="primary" @click="isCollapse = !isCollapse">
					{{ isCollapse ? "展开" : "收起" }}
					<ElIcon><component :is="isCollapse ? ArrowDown : ArrowUp" /></ElIcon>
				</ElButton>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ArrowDown, ArrowUp, MagicStick, RefreshLeft, Search } from "@element-plus/icons-vue";
import { ElButton, ElDatePicker, ElIcon, ElInput, ElOption, ElSelect } from "lmLibs/element-plus";
import EnumSelect from "lmCmpsBasic/EnumSelect";
import { useDictStore } from "lmStore/modules/dict";

const props = withDefaults(
	defineProps<{
		/** 条件项：可直接传 items 数组，也可传 [{ items }] */
		data?: any[];
		hideBar?: boolean;
		loading?: boolean;
		isShowMoreFilter?: boolean;
		fixedShowItemLen?: number;
		columns?: number;
		doSearch?: (keepPage?: boolean, type?: "search" | "reset" | "page") => void;
		/** 是否展示「智能查询」入口 */
		showAiQuery?: boolean;
	}>(),
	{
		data: () => [],
		hideBar: false,
		loading: false,
		isShowMoreFilter: false,
		fixedShowItemLen: undefined,
		columns: 4,
		doSearch: undefined,
		showAiQuery: false
	}
);

const emit = defineEmits<{
	(e: "on-query", params: Record<string, any>): void;
	(e: "reset"): void;
	(e: "on-event-watch", payload: any): void;
	(e: "ai-query"): void;
}>();

const dictStore = useDictStore();

const items = computed<any[]>(() => {
	const list = props.data || [];
	if (list.length && list[0]?.items) return list[0].items;
	return list;
});

const queryData = reactive<Record<string, any>>({});

/** 初始化默认值 */
const initValues = () => {
	items.value.forEach(item => {
		if (!item?.key) return;
		if (item.itemValue !== undefined) queryData[item.key] = item.itemValue;
		else if (queryData[item.key] === undefined) queryData[item.key] = item.props?.multiple ? [] : "";
	});
};
initValues();

const defaultLen = computed(() => props.fixedShowItemLen ?? props.columns * 1 + 1);
const canCollapse = computed(() => props.isShowMoreFilter && items.value.length > defaultLen.value);
const isCollapse = ref(canCollapse.value);

const showItems = computed(() => {
	if (!canCollapse.value) return items.value;
	return isCollapse.value ? items.value.slice(0, defaultLen.value) : items.value;
});

/** 组件类型解析 */
const resolveType = (type: any) => {
	if (typeof type !== "string") return type || ElInput;
	switch (type) {
		case "enumSelect":
			return EnumSelect;
		case "select":
		case "selectTwo":
			return ElSelect;
		case "date":
		case "datePicker":
		case "timeSwitch":
			return ElDatePicker;
		case "remoteSelect":
			return ElInput;
		default:
			return ElInput;
	}
};

/** 绑定属性 */
const bindProps = (item: any) => {
	const base: Record<string, any> = { ...(item.props || {}) };
	if (item.type === "enumSelect" || typeof item.type === "object") {
		const dictType = (item.type as any)?.props?.type || item.props?.type;
		const options = dictType ? dictStore.getDict(dictType) : item.props?.options || item.props?.data || [];
		return { ...base, dictType, data: options, options };
	}
	if (item.type === "select" || item.type === "selectTwo") {
		return { ...base, options: item.props?.options || item.props?.data || [] };
	}
	return base;
};

const getQueryData = () => ({ ...queryData });

/** 查询 */
const onSearch = () => {
	emit("on-query", { ...queryData });
	props.doSearch?.(false, "search");
};

/** 重置 */
const onReset = () => {
	Object.keys(queryData).forEach(k => (queryData[k] = Array.isArray(queryData[k]) ? [] : ""));
	items.value.forEach(item => {
		if (item?.key && item.itemValue !== undefined) queryData[item.key] = item.itemValue;
	});
	emit("reset");
	emit("on-query", { ...queryData });
	props.doSearch?.(false, "reset");
};

/** 供 AI 查询回填条件 */
const setQueryData = (partial: Record<string, any>) => {
	Object.assign(queryData, partial);
};

defineExpose({ getQueryData, onSearch, onReset, setQueryData });
</script>

<style lang="less">
@import "./index.less";
</style>
