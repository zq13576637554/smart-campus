<!-- 考试管理 -->
<template>
	<div class="page-container exam-page">
		<div class="exam-page__stats">
			<div v-for="item in statCards" :key="item.label" class="exam-page__stat">
				<div class="exam-page__stat-label">{{ item.label }}</div>
				<div class="exam-page__stat-value">{{ item.value }}<em>{{ item.unit }}</em></div>
			</div>
		</div>

		<div class="exam-page__list">
			<NPageBasic
				ref="pageRef"
				title="考试计划"
				row-key="id"
				:bars="bars"
				:cols="cols"
				:api="fetchData"
				:is-show-more-filter="true"
				@on-tb-event-watch="onTbAction"
			>
				<template #handle-buttons>
					<ElButton type="primary" @click="openForm()">新增考试</ElButton>
				</template>
			</NPageBasic>
		</div>

		<!-- 考场安排 -->
		<Dialog v-model="roomsVisible" :title="`考场安排 · ${currentExam}`" width="760px" ok-text="关闭" @ok="roomsVisible = false">
			<ElTable :data="rooms" height="360" stripe>
				<ElTableColumn type="index" label="#" width="60" />
				<ElTableColumn label="楼栋" prop="building" min-width="100" />
				<ElTableColumn label="考场" prop="roomNo" min-width="90" />
				<ElTableColumn label="座位数" prop="seats" min-width="90" />
				<ElTableColumn label="已安排" prop="used" min-width="90" />
				<ElTableColumn label="监考老师" prop="invigilator" min-width="120" />
				<ElTableColumn label="使用率" min-width="130">
					<template #default="{ row }">
						<ElProgress :percentage="Math.round((row.used / row.seats) * 100)" :stroke-width="8" />
					</template>
				</ElTableColumn>
			</ElTable>
		</Dialog>

		<!-- 新增/编辑 -->
		<Dialog v-model="formVisible" :title="formData.id ? '编辑考试' : '新增考试'" :loading="submitting" width="600px" @ok="submitForm">
			<Form ref="formRef" :items="formItems" :form-data="formData" :show-footer="false" label-width="90px" />
		</Dialog>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElButton, ElMessage, ElMessageBox, ElProgress, ElTable, ElTableColumn } from "lmLibs/element-plus";
import NPageBasic from "lmCmpsBiz/NPageBasic";
import Dialog from "lmCmpsBasic/Dialog";
import Form from "lmCmpsBasic/Form";
import type { FormItem } from "lmCmpsBasic/Form/types";
import { Input, Select, Date, Number_ } from "lmIreposF";
import { useSimpleCols } from "lmHooks/tools/useCols";
import { useSimpleBars } from "lmHooks/tools/useBars";
import { $examPagePost, $examPublishPost, $examRoomsGet, $examSavePost, $examStatisticsGet } from "lmApisCampus/api/exam";
import { sync } from "lmUtils/promise";

const pageRef = ref();
const formRef = ref();
const stats = ref<Record<string, any>>({});
const roomsVisible = ref(false);
const formVisible = ref(false);
const submitting = ref(false);
const rooms = ref<any[]>([]);
const currentExam = ref("");

const STATUS: Record<string, { text: string; type: string }> = {
	DRAFT: { text: "草稿", type: "info" },
	PUBLISHED: { text: "已发布", type: "success" },
	FINISHED: { text: "已结束", type: "primary" }
};

const statCards = computed(() => [
	{ label: "考试场次", value: stats.value.total || 0, unit: "场" },
	{ label: "已发布", value: stats.value.published || 0, unit: "场" },
	{ label: "待发布", value: stats.value.draft || 0, unit: "场" },
	{ label: "考场总数", value: stats.value.rooms || 0, unit: "间" }
]);

const bars = computed(() =>
	useSimpleBars([
		"考试名称|name|input",
		{
			bar: "考试类型|type|enum-type:EXAM_TYPE",
			config: { itemValue: "" }
		},
		{
			bar: "年级|grade|select",
			config: { props: { options: ["高一", "高二", "高三"].map(g => ({ label: g, value: g })) } }
		},
		{
			bar: "状态|status|select",
			config: {
				props: {
					options: Object.keys(STATUS).map(k => ({ label: STATUS[k].text, value: k }))
				}
			}
		}
	])
);

const cols = computed(() =>
	useSimpleCols([
		"idx",
		"考试名称|name|text|minWidth:230",
		{
			col: "类型|type|tag|minWidth:110",
			setComProps: { dictType: "EXAM_TYPE" }
		},
		"年级|grade|minWidth:90",
		"考试日期|date|minWidth:120",
		{
			col: "时间|startTime|text|minWidth:130",
			tdFn: (h: any, ctx: any) => h("span", {}, `${ctx.data.row.startTime} - ${ctx.data.row.endTime}`)
		},
		{ col: "考场数|roomCount|text|minWidth:90", tdFn: (h: any, ctx: any) => h("span", {}, `${ctx.data.row.roomCount} 间`) },
		{ col: "考生数|studentCount|text|minWidth:90", tdFn: (h: any, ctx: any) => h("span", {}, `${ctx.data.row.studentCount} 人`) },
		{
			col: "状态|status|tag|minWidth:100",
			setComProps: (row: any) => ({ type: STATUS[row.status]?.type || "info", text: STATUS[row.status]?.text || row.status })
		},
		{
			col: "actions|考场:rooms-发布:publish-编辑:edit",
			setComProps: {
				fixed: "right",
				minWidth: 190,
				cmds: (row: any) => {
					const list: any[] = [{ text: "考场", action: "rooms" }];
					if (row.status === "DRAFT") list.push({ text: "发布", action: "publish" });
					list.push({ text: "编辑", action: "edit" });
					return list;
				}
			}
		}
	])
);

const formData = reactive<Record<string, any>>({
	id: "",
	name: "",
	type: "MIDTERM",
	grade: "高一",
	date: "",
	startTime: "09:00",
	endTime: "11:00",
	roomCount: 6,
	studentCount: 120
});

const formItems = computed<FormItem[]>(() => [
	Input({ label: "考试名称", prop: "name", colProps: { span: 24 }, rules: [{ required: true, message: "请输入考试名称", trigger: "blur" }] }),
	Select({ label: "考试类型", prop: "type", type: "enumSelect", dictType: "EXAM_TYPE" }),
	Select({ label: "年级", prop: "grade", options: ["高一", "高二", "高三"].map(g => ({ label: g, value: g })) }),
	Date({ label: "考试日期", prop: "date", rules: [{ required: true, message: "请选择考试日期", trigger: "change" }], yours: { style: "width:100%" } }),
	Input({ label: "开始时间", prop: "startTime", yours: { placeholder: "09:00" } }),
	Input({ label: "结束时间", prop: "endTime", yours: { placeholder: "11:00" } }),
	Number_({ label: "考场数", prop: "roomCount", yours: { min: 1, max: 30 } }),
	Number_({ label: "考生数", prop: "studentCount", yours: { min: 0, max: 2000 } })
]);

const fetchData = (params: Record<string, any>) => $examPagePost(params);

const loadStats = async () => {
	const [err, res] = await sync($examStatisticsGet());
	if (!err) stats.value = (res as any) || {};
};

const openForm = (row?: any) => {
	Object.assign(formData, {
		id: row?.id || "",
		name: row?.name || "",
		type: row?.type || "MIDTERM",
		grade: row?.grade || "高一",
		date: row?.date || "",
		startTime: row?.startTime || "09:00",
		endTime: row?.endTime || "11:00",
		roomCount: row?.roomCount ?? 6,
		studentCount: row?.studentCount ?? 120
	});
	formVisible.value = true;
};

const submitForm = async () => {
	const valid = await formRef.value?.__validForm?.();
	if (!valid) return;
	submitting.value = true;
	try {
		const [err] = await sync($examSavePost({ ...formData }));
		if (err) return;
		ElMessage.success("保存成功");
		formVisible.value = false;
		pageRef.value.doSearch(true, "search");
		loadStats();
	} finally {
		submitting.value = false;
	}
};

const openRooms = async (row: any) => {
	currentExam.value = row.name;
	const [err, res] = await sync($examRoomsGet({ examId: row.id }));
	rooms.value = err ? [] : ((res as any) || []);
	roomsVisible.value = true;
};

const onTbAction = async ({ key, data }: any) => {
	const row = data?.data?.row;
	if (key === "rooms") return openRooms(row);
	if (key === "edit") return openForm(row);
	if (key === "publish") {
		const ok = await ElMessageBox.confirm(`确认发布「${row.name}」的考场与监考安排？`, "发布确认", { type: "warning" }).catch(() => false);
		if (!ok) return;
		const [err] = await sync($examPublishPost({ id: row.id }));
		if (!err) {
			ElMessage.success("已发布");
			pageRef.value.doSearch(true, "search");
			loadStats();
		}
	}
};

onMounted(loadStats);
</script>

<style lang="less">
.exam-page {
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
