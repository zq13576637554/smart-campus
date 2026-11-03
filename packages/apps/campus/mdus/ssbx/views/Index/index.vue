<!-- 宿舍报修 -->
<template>
	<div class="page-container repair-page">
		<div class="repair-page__stats">
			<div v-for="item in statCards" :key="item.label" class="repair-page__stat" :class="`is-${item.type}`">
				<div class="repair-page__stat-label">{{ item.label }}</div>
				<div class="repair-page__stat-value">{{ item.value }}<em>{{ item.unit }}</em></div>
			</div>
		</div>

		<div class="repair-page__list">
			<NPageBasic
				ref="pageRef"
				title="报修工单"
				row-key="id"
				:bars="bars"
				:cols="cols"
				:api="fetchData"
				:is-show-more-filter="true"
				@on-tb-event-watch="onTbAction"
			>
				<template #handle-buttons>
					<ElButton type="primary" @click="openCreate">新增报修</ElButton>
				</template>
			</NPageBasic>
		</div>

		<!-- 派单 -->
		<Dialog v-model="assignVisible" title="派单处理" :loading="submitting" width="460px" @ok="submitAssign">
			<ElForm :model="assignForm" label-width="90px">
				<ElFormItem label="工单">
					<span>{{ current.description }}</span>
				</ElFormItem>
				<ElFormItem label="维修人员">
					<ElSelect v-model="assignForm.handler" style="width: 100%">
						<ElOption v-for="w in workers" :key="w" :label="w" :value="w" />
					</ElSelect>
				</ElFormItem>
			</ElForm>
		</Dialog>

		<!-- 新增报修 -->
		<Dialog v-model="createVisible" title="新增报修" :loading="submitting" width="520px" @ok="submitCreate">
			<Form ref="createFormRef" :items="createItems" :form-data="createData" :show-footer="false" label-width="90px" />
		</Dialog>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import {
	ElButton,
	ElForm,
	ElFormItem,
	ElMessage,
	ElMessageBox,
	ElOption,
	ElSelect
} from "lmLibs/element-plus";
import NPageBasic from "lmCmpsBiz/NPageBasic";
import Dialog from "lmCmpsBasic/Dialog";
import Form from "lmCmpsBasic/Form";
import type { FormItem } from "lmCmpsBasic/Form/types";
import { Input, Select } from "lmIreposF";
import { useSimpleCols } from "lmHooks/tools/useCols";
import { useSimpleBars } from "lmHooks/tools/useBars";
import { $repairAssignPost, $repairCreatePost, $repairFinishPost, $repairPagePost, $repairStatisticsGet } from "lmApisCampus/api/life";
import { sync } from "lmUtils/promise";

const pageRef = ref();
const createFormRef = ref();
const stats = ref<Record<string, any>>({});
const assignVisible = ref(false);
const createVisible = ref(false);
const submitting = ref(false);
const current = ref<Record<string, any>>({});
const workers = ["维修组-老周", "维修组-小陈", "维修组-老李"];

const assignForm = reactive({ handler: "维修组-老周" });
const createData = reactive<Record<string, any>>({ dorm: "", reporter: "", phone: "", type: "空调", description: "", level: "NORMAL" });

const STATUS: Record<string, { text: string; type: string }> = {
	PENDING: { text: "待接单", type: "warning" },
	PROCESSING: { text: "处理中", type: "primary" },
	DONE: { text: "已完成", type: "success" }
};

const REPAIR_TYPES = ["空调", "热水器", "门锁", "照明", "水管", "网络", "家具", "其他"];

const statCards = computed(() => [
	{ label: "工单总数", value: stats.value.total || 0, unit: "单", type: "primary" },
	{ label: "待接单", value: stats.value.pending || 0, unit: "单", type: "warning" },
	{ label: "处理中", value: stats.value.processing || 0, unit: "单", type: "info" },
	{ label: "已完成", value: stats.value.done || 0, unit: "单", type: "success" }
]);

const bars = computed(() =>
	useSimpleBars([
		"宿舍|dorm|input",
		"报修人|reporter|input",
		{
			bar: "报修类型|type|select",
			config: { props: { options: REPAIR_TYPES.map(t => ({ label: t, value: t })) } }
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
			bar: "紧急程度|level|select",
			config: {
				props: {
					options: [
						{ label: "普通", value: "NORMAL" },
						{ label: "紧急", value: "URGENT" }
					]
				}
			}
		}
	])
);

const cols = computed(() =>
	useSimpleCols([
		"idx",
		"工单号|id|text|minWidth:120",
		"宿舍|dorm|minWidth:110",
		"报修人|reporter|minWidth:100",
		{
			col: "类型|type|tag|minWidth:90",
			setComProps: (row: any) => ({ type: row.type === "空调" || row.type === "热水器" ? "warning" : "info", text: row.type })
		},
		"故障描述|description|minWidth:220",
		{
			col: "紧急|level|tag|minWidth:90",
			setComProps: (row: any) => ({ type: row.level === "URGENT" ? "danger" : "info", text: row.level === "URGENT" ? "紧急" : "普通" })
		},
		"提交时间|createTime|minWidth:170",
		{
			col: "状态|status|tag|minWidth:100",
			setComProps: (row: any) => ({ type: STATUS[row.status]?.type || "info", text: STATUS[row.status]?.text || row.status })
		},
		"维修人|handler|minWidth:110",
		{
			col: "actions|派单:assign-完成:finish",
			setComProps: {
				fixed: "right",
				minWidth: 150,
				cmds: (row: any) => {
					if (row.status === "PENDING") return [{ text: "派单", action: "assign" }];
					if (row.status === "PROCESSING") return [{ text: "完成", action: "finish" }];
					return [];
				}
			}
		}
	])
);

const createItems = computed<FormItem[]>(() => [
	Input({ label: "宿舍", prop: "dorm", rules: [{ required: true, message: "请输入宿舍号", trigger: "blur" }], yours: { placeholder: "如 A 栋301" } }),
	Input({ label: "报修人", prop: "reporter", yours: { placeholder: "请输入姓名" } }),
	Input({ label: "联系电话", prop: "phone", yours: { maxlength: 11 } }),
	Select({ label: "报修类型", prop: "type", options: REPAIR_TYPES.map(t => ({ label: t, value: t })) }),
	Select({
		label: "紧急程度",
		prop: "level",
		options: [
			{ label: "普通", value: "NORMAL" },
			{ label: "紧急", value: "URGENT" }
		]
	}),
	Input({
		label: "故障描述",
		prop: "description",
		type: "textarea",
		colProps: { span: 24 },
		rules: [{ required: true, message: "请描述故障", trigger: "blur" }],
		yours: { rows: 3 }
	})
]);

const fetchData = (params: Record<string, any>) => $repairPagePost(params);

const loadStats = async () => {
	const [err, res] = await sync($repairStatisticsGet());
	if (!err) stats.value = (res as any) || {};
};

const openCreate = () => {
	Object.assign(createData, { dorm: "", reporter: "", phone: "", type: "空调", description: "", level: "NORMAL" });
	createVisible.value = true;
};

const submitCreate = async () => {
	const valid = await createFormRef.value?.__validForm?.();
	if (!valid) return;
	submitting.value = true;
	try {
		const [err] = await sync($repairCreatePost({ ...createData }));
		if (err) return;
		ElMessage.success("报修已提交，等待派单");
		createVisible.value = false;
		pageRef.value.doSearch(false, "search");
		loadStats();
	} finally {
		submitting.value = false;
	}
};

const openAssign = (row: any) => {
	current.value = row;
	assignForm.handler = workers[0];
	assignVisible.value = true;
};

const submitAssign = async () => {
	submitting.value = true;
	try {
		const [err] = await sync($repairAssignPost({ id: current.value.id, handler: assignForm.handler }));
		if (err) return;
		ElMessage.success("已派单");
		assignVisible.value = false;
		pageRef.value.doSearch(true, "search");
		loadStats();
	} finally {
		submitting.value = false;
	}
};

const onTbAction = async ({ key, data }: any) => {
	const row = data?.data?.row;
	if (key === "assign") return openAssign(row);
	if (key === "finish") {
		const ok = await ElMessageBox.confirm("确认该工单已处理完成？", "完成确认", { type: "warning" }).catch(() => false);
		if (!ok) return;
		const [err] = await sync($repairFinishPost({ id: row.id }));
		if (!err) {
			ElMessage.success("已标记完成");
			pageRef.value.doSearch(true, "search");
			loadStats();
		}
	}
};

onMounted(loadStats);
</script>

<style lang="less">
.repair-page {
	&__stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 12px;
	}

	&__stat {
		padding: 16px 18px;
		background: var(--sc-card);
		border: 1px solid var(--sc-border);
		border-radius: var(--sc-radius-lg);
		box-shadow: var(--sc-shadow-1);
		border-left: 3px solid var(--sc-primary);

		&.is-warning {
			border-left-color: var(--sc-warning);
		}

		&.is-success {
			border-left-color: var(--sc-success);
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
			font-size: 24px;
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

	&__list {
		flex: 1;
		min-height: 0;
		display: flex;
	}
}
</style>
