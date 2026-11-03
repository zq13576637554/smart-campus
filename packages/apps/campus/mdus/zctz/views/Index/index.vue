<!-- 资产设备台账 -->
<template>
	<div class="page-container asset-page">
		<div class="asset-page__stats">
			<div v-for="item in statCards" :key="item.label" class="asset-page__stat" :class="`is-${item.type}`">
				<div class="asset-page__stat-label">{{ item.label }}</div>
				<div class="asset-page__stat-value">{{ item.value }}<em>{{ item.unit }}</em></div>
			</div>
			<NCard title="资产分类占比" class="asset-page__cats">
				<div v-for="c in stats.byCategory || []" :key="c.name" class="asset-page__cat">
					<span class="asset-page__cat-name">{{ c.name }}</span>
					<div class="asset-page__cat-bar">
						<span :style="{ width: `${(c.value / (stats.total || 1)) * 100}%` }"></span>
					</div>
					<span class="asset-page__cat-value">{{ c.value }} 件</span>
				</div>
			</NCard>
		</div>

		<div class="asset-page__list">
			<NPageBasic
				ref="pageRef"
				title="资产台账"
				row-key="id"
				:bars="bars"
				:cols="cols"
				:api="fetchData"
				@on-tb-event-watch="onTbAction"
			/>
		</div>

		<Dialog v-model="editVisible" title="编辑资产" :loading="submitting" width="600px" @ok="submitEdit">
			<Form ref="editFormRef" :items="editItems" :form-data="editData" :show-footer="false" label-width="90px" />
		</Dialog>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "lmLibs/element-plus";
import NPageBasic from "lmCmpsBiz/NPageBasic";
import NCard from "lmCmpsBasic/NCard";
import Dialog from "lmCmpsBasic/Dialog";
import Form from "lmCmpsBasic/Form";
import type { FormItem } from "lmCmpsBasic/Form/types";
import { Input, Select, Date } from "lmIreposF";
import { useSimpleCols } from "lmHooks/tools/useCols";
import { useSimpleBars } from "lmHooks/tools/useBars";
import { $assetPagePost, $assetSavePost, $assetStatisticsGet } from "lmApisCampus/api/life";
import { sync } from "lmUtils/promise";
import { thousands } from "lmUtils/fmt";

const pageRef = ref();
const editFormRef = ref();
const stats = ref<Record<string, any>>({});
const editVisible = ref(false);
const submitting = ref(false);

const STATUS: Record<string, { text: string; type: string }> = {
	IN_USE: { text: "在用", type: "success" },
	IDLE: { text: "闲置", type: "info" },
	REPAIR: { text: "维修中", type: "warning" },
	SCRAPPED: { text: "已报废", type: "danger" }
};

const CATEGORIES = ["教学设备", "家具", "实验设备", "IT 设备", "办公设备", "电器", "安防设备", "体育设备"];
const OWNERS = ["教务处", "信息中心", "后勤集团", "图书馆", "体育组"];

const editData = reactive<Record<string, any>>({
	id: "",
	code: "",
	name: "",
	category: "教学设备",
	location: "",
	owner: "教务处",
	price: 0,
	purchaseDate: "",
	status: "IN_USE",
	warranty: ""
});

const statCards = computed(() => [
	{ label: "资产总数", value: stats.value.total || 0, unit: "件", type: "primary" },
	{ label: "资产总值", value: thousands(stats.value.value || 0, 0), unit: "元", type: "success" },
	{ label: "在用", value: stats.value.inUse || 0, unit: "件", type: "info" },
	{ label: "待报废", value: stats.value.scrapped || 0, unit: "件", type: "danger" }
]);

const bars = computed(() =>
	useSimpleBars([
		"资产名称|name|input",
		"资产编码|code|input",
		{
			bar: "分类|category|select",
			config: { props: { options: CATEGORIES.map(c => ({ label: c, value: c })) } }
		},
		{
			bar: "状态|status|select",
			config: {
				props: {
					options: Object.keys(STATUS).map(k => ({ label: STATUS[k].text, value: k }))
				}
			}
		},
		{
			bar: "归属|owner|select",
			config: { props: { options: OWNERS.map(o => ({ label: o, value: o })) } }
		}
	])
);

const cols = computed(() =>
	useSimpleCols([
		"idx",
		"资产编码|code|text|minWidth:140",
		"资产名称|name|minWidth:170",
		{
			col: "分类|category|tag|minWidth:110",
			setComProps: (row: any) => ({ type: row.category === "IT 设备" ? "primary" : "info", text: row.category })
		},
		"存放位置|location|minWidth:130",
		"归属部门|owner|minWidth:110",
		{ col: "原值(元)|price|text|minWidth:110", tdFn: (h: any, ctx: any) => h("span", {}, thousands(ctx.data.row.price, 0)) },
		"购置日期|purchaseDate|minWidth:120",
		{
			col: "状态|status|tag|minWidth:100",
			setComProps: (row: any) => ({ type: STATUS[row.status]?.type || "info", text: STATUS[row.status]?.text || row.status })
		},
		"保修截止|warranty|minWidth:120",
		{ col: "actions|编辑:edit", setComProps: { fixed: "right", width: 90 } }
	])
);

const editItems = computed<FormItem[]>(() => [
	Input({ label: "资产名称", prop: "name", rules: [{ required: true, message: "请输入资产名称", trigger: "blur" }] }),
	Input({ label: "资产编码", prop: "code", yours: { disabled: true } }),
	Select({ label: "分类", prop: "category", options: CATEGORIES.map(c => ({ label: c, value: c })) }),
	Select({ label: "归属部门", prop: "owner", options: OWNERS.map(o => ({ label: o, value: o })) }),
	Input({ label: "存放位置", prop: "location" }),
	Select({
		label: "状态",
		prop: "status",
		options: Object.keys(STATUS).map(k => ({ label: STATUS[k].text, value: k }))
	}),
	Date({ label: "购置日期", prop: "purchaseDate", yours: { style: "width:100%" } }),
	Date({ label: "保修截止", prop: "warranty", yours: { style: "width:100%" } })
]);

const fetchData = (params: Record<string, any>) => $assetPagePost(params);

const loadStats = async () => {
	const [err, res] = await sync($assetStatisticsGet());
	if (!err) stats.value = (res as any) || {};
};

const onTbAction = ({ key, data }: any) => {
	if (key !== "edit") return;
	const row = data?.data?.row || {};
	Object.assign(editData, {
		id: row.id,
		code: row.code,
		name: row.name,
		category: row.category,
		location: row.location,
		owner: row.owner,
		price: row.price,
		purchaseDate: row.purchaseDate,
		status: row.status,
		warranty: row.warranty
	});
	editVisible.value = true;
};

const submitEdit = async () => {
	const valid = await editFormRef.value?.__validForm?.();
	if (!valid) return;
	submitting.value = true;
	try {
		const [err] = await sync($assetSavePost({ ...editData }));
		if (err) return;
		ElMessage.success("保存成功");
		editVisible.value = false;
		pageRef.value.doSearch(true, "search");
		loadStats();
	} finally {
		submitting.value = false;
	}
};

onMounted(loadStats);
</script>

<style lang="less">
.asset-page {
	&__stats {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 12px;
	}

	&__stat {
		padding: 16px 18px;
		background: var(--sc-card);
		border: 1px solid var(--sc-border);
		border-radius: var(--sc-radius-lg);
		box-shadow: var(--sc-shadow-1);
		border-left: 3px solid var(--sc-primary);

		&.is-success {
			border-left-color: var(--sc-success);
		}

		&.is-danger {
			border-left-color: var(--sc-danger);
		}

		&.is-info {
			border-left-color: var(--sc-info);
		}

		&-label {
			font-size: 12.5px;
			color: var(--sc-text-3);
		}

		&-value {
			margin-top: 6px;
			font-size: 22px;
			font-weight: 700;
			color: var(--sc-text-1);
			font-variant-numeric: tabular-nums;

			em {
				margin-left: 2px;
				font-size: 12px;
				font-style: normal;
				font-weight: 400;
				color: var(--sc-text-3);
			}
		}
	}

	&__cats {
		grid-column: 1 / -1;
	}

	&__cat {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 7px;

		&:last-child {
			margin-bottom: 0;
		}

		&-name {
			width: 90px;
			font-size: 12.5px;
			color: var(--sc-text-2);
		}

		&-bar {
			flex: 1;
			height: 8px;
			border-radius: 4px;
			background: var(--sc-bg-sunken);
			overflow: hidden;

			span {
				display: block;
				height: 100%;
				border-radius: 4px;
				background: linear-gradient(90deg, var(--sc-primary), #5ce1e6);
			}
		}

		&-value {
			width: 60px;
			text-align: right;
			font-size: 12px;
			color: var(--sc-text-2);
		}
	}

	&__list {
		flex: 1;
		min-height: 0;
		display: flex;
	}
}

@media (max-width: 1400px) {
	.asset-page__stats {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
}
</style>
