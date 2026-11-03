<!-- 表格：内置分页 / 加载 / 列设置 -->
<template>
	<div class="n-tb">
		<div v-if="title || $slots.buttons || openColSetting" class="n-tb__toolbar">
			<div class="n-tb__toolbar-left">
				<slot name="title">
					<span v-if="title" class="n-tb__title">{{ title }}</span>
				</slot>
				<span v-if="total" class="n-tb__total">共 {{ total }} 条</span>
			</div>
			<div class="n-tb__toolbar-right">
				<slot name="buttons"></slot>
				<ElTooltip content="刷新" placement="top">
					<ElButton class="n-tb__icon-btn" text @click="search({ keepPage: true })">
						<ElIcon><Refresh /></ElIcon>
					</ElButton>
				</ElTooltip>
				<ElDropdown v-if="openColSetting" trigger="click" :hide-on-click="false">
					<ElButton class="n-tb__icon-btn" text>
						<ElIcon><Setting /></ElIcon>
					</ElButton>
					<template #dropdown>
						<div class="n-tb__cols">
							<div class="n-tb__cols-head">列设置</div>
							<ElCheckbox
								v-for="col in settableCols"
								:key="col.prop"
								:model-value="!hiddenCols.includes(col.prop)"
								@change="val => toggleCol(col.prop, !!val)"
							>
								{{ col.label }}
							</ElCheckbox>
						</div>
					</template>
				</ElDropdown>
			</div>
		</div>

		<div class="n-tb__table-wrap">
			<!-- 首次加载骨架屏 -->
			<div v-if="showSkeleton" class="n-tb__skeleton">
				<ElSkeleton :rows="6" animated />
			</div>

			<ElTable
				v-else
				ref="tableRef"
				v-loading="loading"
				:data="tableData"
				:row-key="rowKey"
				:stripe="stripe"
				:border="border"
				:max-height="maxHeight"
				:height="tableHeight"
				:show-summary="showSummary"
				:empty-text="emptyText"
				class="n-tb__table"
				v-bind="tbProps"
				@selection-change="onSelectionChange"
				@row-click="(...args) => $emit('row-click', ...args)"
				@expand-change="(...args) => $emit('expand-change', ...args)"
				@sort-change="onSortChange"
			>
			<ElTableColumn
				v-for="col in visibleCols"
				:key="col.prop || col.label"
				v-bind="columnAttrs(col)"
			>
				<template v-if="col.type === 'selection'" #default="scope">
					<ElCheckbox :model-value="isSelected(scope.row)" @change="val => toggleRow(scope.row, !!val)" @click.stop />
				</template>
				<template v-else-if="col.type === 'expand'" #default="scope">
					<slot name="expand" :data="scope"></slot>
				</template>
				<template v-else #default="scope">
					<TbCell
						:col="col"
						:row="scope.row"
						:index="scope.$index"
						:tb="tbState"
						:emit-event="onCellEvent"
						:dict-label="dictLabel"
						:dict-type="dictType"
					/>
				</template>
			</ElTableColumn>

			<template #empty>
				<slot name="empty">
					<Empty :text="emptyText" :padding="24" />
				</slot>
			</template>
			</ElTable>
		</div>

		<div v-if="showPagination" class="n-tb__pager">
			<ElPagination
				v-model:current-page="pageNumber"
				v-model:page-size="pageSize"
				:total="total"
				:page-sizes="pageSizes"
				layout="total, sizes, prev, pager, next, jumper"
				background
				@size-change="onSizeChange"
				@current-change="onPageChange"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { Refresh, Setting } from "@element-plus/icons-vue";
import {
	ElButton,
	ElCheckbox,
	ElDropdown,
	ElIcon,
	ElPagination,
	ElSkeleton,
	ElTable,
	ElTableColumn,
	ElTooltip
} from "lmLibs/element-plus";
import Empty from "lmCmpsBasic/Empty";
import { useDict } from "lmHooks/tools/useDict";
import TbCell from "./TbCell.vue";

const props = withDefaults(
	defineProps<{
		/** 数据接口：(params, type) => Promise<{content,total} | any[]> */
		fetch?: (params: Record<string, any>, type?: string) => Promise<any>;
		cols?: any[];
		rowKey?: string;
		title?: string;
		stripe?: boolean;
		border?: boolean;
		maxHeight?: string | number;
		tableHeight?: string | number;
		showSummary?: boolean;
		emptyText?: string;
		openColSetting?: boolean;
		showPagination?: boolean;
		pageSizes?: number[];
		defaultPageSize?: number;
		/** 额外请求参数 */
		params?: Record<string, any>;
		/** 数据转换 */
		transformRecords?: (list: any[]) => any[];
		cellClassName?: (data: any) => string;
		tbProps?: Record<string, any>;
		/** 是否初始化即请求 */
		autoFetch?: boolean;
		/** 首次加载是否展示骨架屏 */
		showSkeleton?: boolean;
	}>(),
	{
		fetch: undefined,
		cols: () => [],
		rowKey: "id",
		title: "",
		stripe: true,
		border: false,
		maxHeight: undefined,
		tableHeight: "100%",
		showSummary: false,
		emptyText: "暂无数据",
		openColSetting: true,
		showPagination: true,
		pageSizes: () => [10, 20, 50, 100],
		defaultPageSize: 10,
		params: () => ({}),
		transformRecords: undefined,
		cellClassName: undefined,
		tbProps: () => ({}),
		autoFetch: true,
		showSkeleton: true
	}
);

const emit = defineEmits<{
	(e: "selection-change", rows: any[]): void;
	(e: "row-click", ...args: any[]): void;
	(e: "expand-change", ...args: any[]): void;
	(e: "on-event-watch", payload: { key: string; data: any }): void;
	(e: "register", instance: any): void;
	(e: "loaded", payload: { list: any[]; total: number }): void;
}>();

const { dictLabel, dictType } = useDict();

const tableRef = ref();
const tableData = ref<any[]>([]);
const total = ref(0);
const loading = ref(false);
const pageNumber = ref(1);
const pageSize = ref(props.defaultPageSize);
const sortParams = ref<Record<string, any>>({});
const hiddenCols = ref<string[]>([]);
const selectedRows = ref<any[]>([]);

const visibleCols = computed(() => props.cols.filter(c => !hiddenCols.value.includes(c.prop)));
const settableCols = computed(() => props.cols.filter(c => !["selection", "expand", "actions"].includes(c.type) && c.label));

/** 首次加载（还没有数据）时展示骨架屏 */
const showSkeleton = computed(() => props.showSkeleton && loading.value && tableData.value.length === 0);

const tbState = computed(() => ({ pageNumber: pageNumber.value, pageSize: pageSize.value }));

/** 列属性：过滤掉渲染器私有字段 */
const columnAttrs = (col: any) => {
	const { tdFn, setComProps, cmds, formatValue, renderHeader, dictType: _dt, beforeRender, yours, ...rest } = col;
	const attrs: Record<string, any> = { ...rest };
	if (attrs.minWidth) attrs.minWidth = Number(attrs.minWidth);
	if (attrs.width) attrs.width = Number(attrs.width);
	if (col.type === "selection") {
		attrs.width = attrs.width || 48;
	}
	if (col.type === "expand") {
		attrs.type = "expand";
	}
	return attrs;
};

const toggleCol = (prop: string, checked: boolean) => {
	if (checked) hiddenCols.value = hiddenCols.value.filter(p => p !== prop);
	else hiddenCols.value.push(prop);
};

const onCellEvent = (key: string, data: any) => {
	emit("on-event-watch", { key, data });
};

/** 请求数据 */
const load = async (type: "search" | "reset" | "page" = "search") => {
	if (!props.fetch) {
		tableData.value = [];
		total.value = 0;
		return;
	}
	loading.value = true;
	try {
		const res = await props.fetch(
			{ ...props.params, pageNumber: pageNumber.value, pageSize: pageSize.value, ...sortParams.value },
			type
		);
		let list: any[] = [];
		if (Array.isArray(res)) {
			list = res;
			total.value = res.length;
		} else if (res) {
			list = res.content || res.records || res.list || res.data || [];
			total.value = Number(res.total ?? res.totalElements ?? list.length);
		}
		const transformed = props.transformRecords ? props.transformRecords(list) : list;
		// 浅拷贝每一行：mock/接口可能复用同一对象引用，直接赋值会导致 Vue 跳过重渲染
		tableData.value = (transformed || []).map((row: any) => (row && typeof row === "object" ? { ...row } : row));
		emit("loaded", { list: tableData.value, total: total.value });
	} catch (e) {
		tableData.value = [];
		total.value = 0;
	} finally {
		loading.value = false;
	}
};

const search = (opts: { keepPage?: boolean; type?: "search" | "reset" | "page" } = {}) => {
	const { keepPage = false, type = "search" } = opts;
	if (!keepPage) pageNumber.value = 1;
	load(type);
};

const refresh = () => search({ keepPage: true });

const onSizeChange = () => {
	pageNumber.value = 1;
	load("page");
};

const onPageChange = () => load("page");

const onSortChange = ({ prop, order }: any) => {
	sortParams.value = order ? { orderBy: prop, orderType: order === "ascending" ? "asc" : "desc" } : {};
	load("search");
};

const onSelectionChange = (rows: any[]) => {
	selectedRows.value = rows;
	emit("selection-change", rows);
};

const isSelected = (row: any) =>
	selectedRows.value.some(r => (r?.[props.rowKey] !== undefined ? r[props.rowKey] === row?.[props.rowKey] : r === row));

const toggleRow = (row: any, checked: boolean) => {
	selectedRows.value = checked
		? [...selectedRows.value.filter(r => r?.[props.rowKey] !== row?.[props.rowKey]), row]
		: selectedRows.value.filter(r => r?.[props.rowKey] !== row?.[props.rowKey]);
	emit("selection-change", selectedRows.value);
};

const clearSelection = () => {
	tableRef.value?.clearSelection?.();
	selectedRows.value = [];
	emit("selection-change", []);
};

const getSelection = () => selectedRows.value;
const getTableData = () => tableData.value;

watch(
	() => props.fetch,
	() => search(),
	{ deep: false }
);

onMounted(() => {
	emit("register", { search, refresh, clearSelection, getSelection, getTableData, load });
	if (props.autoFetch) load("search");
});

defineExpose({ search, refresh, clearSelection, getSelection, getTableData, load, tableRef, tableData, total });
</script>

<style lang="less">
@import "./index.less";
</style>
