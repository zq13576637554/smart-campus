<!-- 请假审批 -->
<template>
	<div class="page-container leave-page">
		<div class="leave-page__stats">
			<div v-for="item in statCards" :key="item.label" class="leave-page__stat" :class="`is-${item.type}`">
				<div class="leave-page__stat-icon">
					<NIcon :name="item.icon" :size="18" />
				</div>
				<div>
					<div class="leave-page__stat-label">{{ item.label }}</div>
					<div class="leave-page__stat-value">{{ item.value }}<em>{{ item.unit }}</em></div>
				</div>
			</div>
		</div>

		<div class="leave-page__list">
			<NPageBasic
				ref="pageRef"
				title="请假申请"
				row-key="id"
				:bars="bars"
				:cols="cols"
				:api="fetchData"
				:is-show-more-filter="true"
				@on-tb-event-watch="onTbAction"
				@loaded="onLoaded"
			>
				<template #handle-buttons>
					<ElButton type="primary" @click="openApply()">发起请假</ElButton>
				</template>
			</NPageBasic>
		</div>

		<!-- 发起请假 -->
		<Dialog v-model="applyVisible" title="发起请假申请" :loading="submitting" width="560px" @ok="submitApply">
			<Form ref="applyFormRef" :items="applyItems" :form-data="applyData" :show-footer="false" label-width="90px" />
		</Dialog>

		<!-- 审批 -->
		<Dialog v-model="approveVisible" title="审批请假申请" :loading="submitting" width="520px" @ok="submitApprove">
			<div class="leave-page__approve-info">
				<div><span>申请人</span><strong>{{ current.studentName }}（{{ current.className }}）</strong></div>
				<div><span>请假类型</span><strong>{{ current.type }}</strong></div>
				<div><span>请假时间</span><strong>{{ current.startDate }} ~ {{ current.endDate }}（{{ current.days }} 天）</strong></div>
				<div><span>请假事由</span><strong>{{ current.reason }}</strong></div>
			</div>
			<ElForm :model="approveForm" label-width="90px">
				<ElFormItem label="审批结果">
					<ElRadioGroup v-model="approveForm.status">
						<ElRadio value="APPROVED">通过</ElRadio>
						<ElRadio value="REJECTED">驳回</ElRadio>
					</ElRadioGroup>
				</ElFormItem>
				<ElFormItem label="审批意见">
					<ElInput v-model="approveForm.remark" type="textarea" :rows="3" placeholder="请填写审批意见" />
				</ElFormItem>
			</ElForm>
		</Dialog>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import {
	ElButton,
	ElForm,
	ElFormItem,
	ElInput,
	ElMessage,
	ElRadio,
	ElRadioGroup
} from "lmLibs/element-plus";
import NPageBasic from "lmCmpsBiz/NPageBasic";
import NIcon from "lmCmpsBasic/NIcon";
import Dialog from "lmCmpsBasic/Dialog";
import Form from "lmCmpsBasic/Form";
import type { FormItem } from "lmCmpsBasic/Form/types";
import { Input, Select, Date } from "lmIreposF";
import { useSimpleCols } from "lmHooks/tools/useCols";
import { useSimpleBars } from "lmHooks/tools/useBars";
import { $classOptionsGet } from "lmApisCampus/api/academic";
import { $leaveApplyPost, $leaveApprovePost, $leavePagePost, $leaveTodoCountGet } from "lmApisCampus/api/system";
import { sync } from "lmUtils/promise";
import { dayjs } from "lmUtils/time";
import { useAppStore } from "lmStore/modules/app";

const appStore = useAppStore();
const pageRef = ref();
const applyFormRef = ref();
const applyVisible = ref(false);
const approveVisible = ref(false);
const submitting = ref(false);
const classOptions = ref<any[]>([]);
const rows = ref<any[]>([]);

const current = ref<Record<string, any>>({});
const approveForm = reactive({ status: "APPROVED", remark: "同意" });

const applyData = reactive<Record<string, any>>({
	studentNo: "",
	studentName: "",
	className: "",
	type: "事假",
	startDate: dayjs().add(1, "day").format("YYYY-MM-DD"),
	endDate: dayjs().add(1, "day").format("YYYY-MM-DD"),
	reason: ""
});

const STATUS: Record<string, { text: string; type: string }> = {
	PENDING: { text: "待审批", type: "warning" },
	APPROVED: { text: "已通过", type: "success" },
	REJECTED: { text: "已驳回", type: "danger" }
};

const statCards = computed(() => {
	const pending = rows.value.filter(r => r.status === "PENDING").length;
	const approved = rows.value.filter(r => r.status === "APPROVED").length;
	const days = rows.value.reduce((a, b) => a + Number(b.days || 0), 0);
	return [
		{ label: "待审批", value: pending, unit: "条", type: "warning", icon: "notice" },
		{ label: "已通过", value: approved, unit: "条", type: "success", icon: "score" },
		{ label: "累计请假", value: rows.value.length, unit: "条", type: "primary", icon: "calendar" },
		{ label: "累计天数", value: days, unit: "天", type: "danger", icon: "schedule" }
	];
});

const bars = computed(() =>
	useSimpleBars([
		"姓名|studentName|input",
		"学号|studentNo|input",
		{
			bar: "班级|className|select",
			config: { props: { options: classOptions.value.map(c => ({ label: c.label, value: c.label })) } }
		},
		{
			bar: "类型|type|select",
			config: {
				props: {
					options: ["事假", "病假", "公假"].map(t => ({ label: t, value: t }))
				}
			}
		},
		{
			bar: "审批状态|status|select",
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
		"姓名|studentName|text|minWidth:100",
		"学号|studentNo|minWidth:130",
		"班级|className|minWidth:110",
		{
			col: "类型|type|tag|minWidth:90",
			setComProps: (row: any) => ({ type: row.type === "病假" ? "warning" : "primary", text: row.type })
		},
		"开始日期|startDate|minWidth:120",
		"结束日期|endDate|minWidth:120",
		{ col: "天数|days|text|minWidth:80", tdFn: (h: any, ctx: any) => h("span", {}, `${ctx.data.row.days} 天`) },
		"事由|reason|minWidth:200",
		{
			col: "状态|status|tag|minWidth:100",
			setComProps: (row: any) => ({ type: STATUS[row.status]?.type || "info", text: STATUS[row.status]?.text || row.status })
		},
		"审批人|approver|minWidth:110",
		"申请时间|applyTime|minWidth:170",
		{
			col: "actions|审批:approve",
			setComProps: {
				fixed: "right",
				width: 110,
				cmds: (row: any) => (row.status === "PENDING" ? [{ text: "审批", action: "approve" }] : [])
			}
		}
	])
);

const fetchData = (params: Record<string, any>) => $leavePagePost(params);

const onLoaded = ({ list }: any) => (rows.value = list);

const applyItems = computed<FormItem[]>(() => [
	Input({ label: "学生姓名", prop: "studentName", rules: [{ required: true, message: "请输入学生姓名", trigger: "blur" }] }),
	Input({ label: "学号", prop: "studentNo", yours: { placeholder: "请输入学号" } }),
	Select({
		label: "班级",
		prop: "className",
		yours: { options: classOptions.value.map(c => ({ label: c.label, value: c.label })) }
	}),
	Select({
		label: "请假类型",
		prop: "type",
		options: ["事假", "病假", "公假"].map(t => ({ label: t, value: t }))
	}),
	Date({ label: "开始日期", prop: "startDate", rules: [{ required: true, message: "请选择开始日期", trigger: "change" }], yours: { style: "width:100%" } }),
	Date({ label: "结束日期", prop: "endDate", rules: [{ required: true, message: "请选择结束日期", trigger: "change" }], yours: { style: "width:100%" } }),
	Input({
		label: "请假事由",
		prop: "reason",
		type: "textarea",
		colProps: { span: 24 },
		rules: [{ required: true, message: "请填写请假事由", trigger: "blur" }],
		yours: { rows: 3, placeholder: "请说明请假原因" }
	})
]);

const openApply = () => {
	Object.assign(applyData, {
		studentNo: "",
		studentName: "",
		className: classOptions.value[0]?.label || "",
		type: "事假",
		startDate: dayjs().add(1, "day").format("YYYY-MM-DD"),
		endDate: dayjs().add(1, "day").format("YYYY-MM-DD"),
		reason: ""
	});
	applyVisible.value = true;
};

const submitApply = async () => {
	const valid = await applyFormRef.value?.__validForm?.();
	if (!valid) return;
	submitting.value = true;
	try {
		const [err] = await sync($leaveApplyPost({ ...applyData }));
		if (err) return;
		ElMessage.success("申请已提交，等待审批");
		applyVisible.value = false;
		pageRef.value.doSearch(false, "search");
	} finally {
		submitting.value = false;
	}
};

const onTbAction = ({ key, data }: any) => {
	if (key !== "approve") return;
	current.value = data?.data?.row || {};
	approveForm.status = "APPROVED";
	approveForm.remark = "同意";
	approveVisible.value = true;
};

const submitApprove = async () => {
	submitting.value = true;
	try {
		const [err] = await sync(
			$leaveApprovePost({
				id: current.value.id,
				status: approveForm.status,
				remark: approveForm.remark,
				approver: appStore.getUserInfo?.nickName || "系统管理员"
			})
		);
		if (err) return;
		ElMessage.success(approveForm.status === "APPROVED" ? "已通过，考勤已同步" : "已驳回");
		approveVisible.value = false;
		pageRef.value.doSearch(true, "search");
	} finally {
		submitting.value = false;
	}
};

onMounted(async () => {
	const [err, res] = await sync($classOptionsGet());
	if (!err) classOptions.value = res as any;
	const [, todo] = await sync($leaveTodoCountGet());
	if (todo) appStore.setSystemConfig({ ...appStore.getSystemConfig, todoCount: (todo as any).count });
});
</script>

<style lang="less">
.leave-page {
	&__stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 12px;
	}

	&__stat {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px;
		background: var(--sc-card);
		border: 1px solid var(--sc-border);
		border-radius: var(--sc-radius-lg);
		box-shadow: var(--sc-shadow-1);

		&-icon {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 38px;
			height: 38px;
			border-radius: 10px;
			color: var(--sc-primary);
			background: var(--sc-primary-soft);
		}

		&.is-success &-icon {
			color: var(--sc-success);
			background: #e8ffea;
		}

		&.is-warning &-icon {
			color: var(--sc-warning);
			background: var(--sc-warning-soft);
		}

		&.is-danger &-icon {
			color: var(--sc-danger);
			background: #ffece8;
		}

		&-label {
			font-size: 12.5px;
			color: var(--sc-text-3);
		}

		&-value {
			margin-top: 2px;
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

	&__list {
		flex: 1;
		min-height: 0;
		display: flex;
	}

	&__approve-info {
		display: grid;
		gap: 8px;
		margin-bottom: 16px;
		padding: 12px 14px;
		border-radius: var(--sc-radius);
		background: var(--sc-bg-sunken);
		font-size: 13px;

		div {
			display: flex;
			gap: 10px;
		}

		span {
			flex: 0 0 68px;
			color: var(--sc-text-3);
		}

		strong {
			font-weight: 500;
			color: var(--sc-text-1);
		}
	}
}
</style>
