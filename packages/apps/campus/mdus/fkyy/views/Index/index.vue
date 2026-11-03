<!-- 访客预约 -->
<template>
	<div class="page-container visitor-page">
		<div class="visitor-page__stats">
			<div v-for="item in statCards" :key="item.label" class="visitor-page__stat">
				<div class="visitor-page__stat-label">{{ item.label }}</div>
				<div class="visitor-page__stat-value">{{ item.value }}<em>{{ item.unit }}</em></div>
			</div>
		</div>

		<div class="visitor-page__list">
			<NPageBasic
				ref="pageRef"
				title="访客预约"
				row-key="id"
				:bars="bars"
				:cols="cols"
				:api="fetchData"
				@on-tb-event-watch="onTbAction"
			>
				<template #handle-buttons>
					<ElButton type="primary" @click="openCreate">新增预约</ElButton>
				</template>
			</NPageBasic>
		</div>

		<!-- 通行凭证 -->
		<Dialog v-model="passVisible" title="访客通行凭证" width="420px" ok-text="关闭" @ok="passVisible = false">
			<div class="visitor-page__pass">
				<div class="visitor-page__pass-name">{{ current.name }}</div>
				<div class="visitor-page__pass-code">{{ current.code }}</div>
				<div class="visitor-page__pass-meta">
					<span>接待人：{{ current.visitTarget }}</span>
					<span>来访时间：{{ current.visitTime }}</span>
					<span>人数：{{ current.personCount }} 人</span>
				</div>
				<div class="visitor-page__pass-tip">请向门卫出示此凭证，或扫描门禁二维码通行</div>
			</div>
		</Dialog>

		<!-- 新增预约 -->
		<Dialog v-model="createVisible" title="新增访客预约" :loading="submitting" width="560px" @ok="submitCreate">
			<Form ref="createFormRef" :items="createItems" :form-data="createData" :show-footer="false" label-width="90px" />
		</Dialog>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElButton, ElMessage, ElMessageBox } from "lmLibs/element-plus";
import NPageBasic from "lmCmpsBiz/NPageBasic";
import Dialog from "lmCmpsBasic/Dialog";
import Form from "lmCmpsBasic/Form";
import type { FormItem } from "lmCmpsBasic/Form/types";
import { Input, Select, Date, Number_ } from "lmIreposF";
import { useSimpleCols } from "lmHooks/tools/useCols";
import { useSimpleBars } from "lmHooks/tools/useBars";
import { $visitorApprovePost, $visitorCheckinPost, $visitorCreatePost, $visitorPagePost, $visitorStatisticsGet } from "lmApisCampus/api/life";
import { sync } from "lmUtils/promise";

const pageRef = ref();
const createFormRef = ref();
const stats = ref<Record<string, any>>({});
const passVisible = ref(false);
const createVisible = ref(false);
const submitting = ref(false);
const current = ref<Record<string, any>>({});

const createData = reactive<Record<string, any>>({
	name: "",
	phone: "",
	company: "",
	visitTarget: "教务处",
	reason: "工作交流",
	visitTime: "",
	duration: "2 小时",
	personCount: 1
});

const STATUS: Record<string, { text: string; type: string }> = {
	PENDING: { text: "待审批", type: "warning" },
	APPROVED: { text: "已通过", type: "primary" },
	VISITED: { text: "已到访", type: "success" },
	EXPIRED: { text: "已过期", type: "info" },
	REJECTED: { text: "已拒绝", type: "danger" }
};

const TARGETS = ["张校长", "教务处", "学生处", "信息中心", "后勤集团"];

const statCards = computed(() => [
	{ label: "预约总数", value: stats.value.total || 0, unit: "条" },
	{ label: "待审批", value: stats.value.pending || 0, unit: "条" },
	{ label: "已到访", value: stats.value.visited || 0, unit: "条" },
	{ label: "来访人数", value: stats.value.people || 0, unit: "人" }
]);

const bars = computed(() =>
	useSimpleBars([
		"访客姓名|name|input",
		"手机号|phone|input",
		{
			bar: "接待部门|visitTarget|select",
			config: { props: { options: TARGETS.map(t => ({ label: t, value: t })) } }
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
		"访客|name|text|minWidth:100",
		"手机号|phone|minWidth:130",
		"来访单位|company|minWidth:130",
		"接待人|visitTarget|minWidth:110",
		"事由|reason|minWidth:120",
		"来访时间|visitTime|minWidth:170",
		{ col: "人数|personCount|text|minWidth:80", tdFn: (h: any, ctx: any) => h("span", {}, `${ctx.data.row.personCount} 人`) },
		{
			col: "状态|status|tag|minWidth:100",
			setComProps: (row: any) => ({ type: STATUS[row.status]?.type || "info", text: STATUS[row.status]?.text || row.status })
		},
		{
			col: "actions|通过:approve-到访:checkin-凭证:pass",
			setComProps: {
				fixed: "right",
				minWidth: 210,
				cmds: (row: any) => {
					const list: any[] = [];
					if (row.status === "PENDING") list.push({ text: "通过", action: "approve" });
					if (row.status === "APPROVED") list.push({ text: "到访", action: "checkin" });
					if (row.status !== "EXPIRED") list.push({ text: "凭证", action: "pass" });
					return list;
				}
			}
		}
	])
);

const createItems = computed<FormItem[]>(() => [
	Input({ label: "访客姓名", prop: "name", rules: [{ required: true, message: "请输入姓名", trigger: "blur" }] }),
	Input({ label: "手机号", prop: "phone", rules: [{ required: true, message: "请输入手机号", trigger: "blur" }], yours: { maxlength: 11 } }),
	Input({ label: "来访单位", prop: "company", yours: { placeholder: "如 市教育局" } }),
	Select({ label: "接待人", prop: "visitTarget", options: TARGETS.map(t => ({ label: t, value: t })) }),
	Input({ label: "事由", prop: "reason", yours: { placeholder: "如 工作交流" } }),
	Date({ label: "来访日期", prop: "visitTime", yours: { style: "width:100%" } }),
	Input({ label: "停留时长", prop: "duration", yours: { placeholder: "如 2 小时" } }),
	Number_({ label: "人数", prop: "personCount", yours: { min: 1, max: 20 } })
]);

const fetchData = (params: Record<string, any>) => $visitorPagePost(params);

const loadStats = async () => {
	const [err, res] = await sync($visitorStatisticsGet());
	if (!err) stats.value = (res as any) || {};
};

const openCreate = () => {
	Object.assign(createData, {
		name: "",
		phone: "",
		company: "",
		visitTarget: "教务处",
		reason: "工作交流",
		visitTime: "",
		duration: "2 小时",
		personCount: 1
	});
	createVisible.value = true;
};

const submitCreate = async () => {
	const valid = await createFormRef.value?.__validForm?.();
	if (!valid) return;
	submitting.value = true;
	try {
		const [err] = await sync($visitorCreatePost({ ...createData }));
		if (err) return;
		ElMessage.success("预约已提交，等待审批");
		createVisible.value = false;
		pageRef.value.doSearch(false, "search");
		loadStats();
	} finally {
		submitting.value = false;
	}
};

const onTbAction = async ({ key, data }: any) => {
	const row = data?.data?.row;
	if (key === "pass") {
		current.value = row;
		passVisible.value = true;
		return;
	}
	if (key === "approve") {
		const ok = await ElMessageBox.confirm(`确认通过访客「${row.name}」的预约？`, "审批确认", { type: "warning" }).catch(() => false);
		if (!ok) return;
		const [err] = await sync($visitorApprovePost({ id: row.id, status: "APPROVED" }));
		if (!err) {
			ElMessage.success("已通过");
			pageRef.value.doSearch(true, "search");
			loadStats();
		}
		return;
	}
	if (key === "checkin") {
		const [err, code] = await sync($visitorCheckinPost({ id: row.id }));
		if (!err) {
			ElMessage.success(`已登记到访，通行码 ${code}`);
			pageRef.value.doSearch(true, "search");
			loadStats();
		}
	}
};

onMounted(loadStats);
</script>

<style lang="less">
.visitor-page {
	&__stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
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

	&__pass {
		text-align: center;
		padding: 8px 0 4px;

		&-name {
			font-size: 18px;
			font-weight: 600;
			color: var(--sc-text-1);
		}

		&-code {
			margin: 10px auto 14px;
			padding: 14px 0;
			width: 260px;
			border-radius: 10px;
			background: var(--sc-primary-soft);
			border: 1px dashed #bedaff;
			color: var(--sc-primary);
			font-size: 22px;
			font-weight: 700;
			letter-spacing: 3px;
			font-family: Menlo, Consolas, monospace;
		}

		&-meta {
			display: flex;
			flex-direction: column;
			gap: 4px;
			font-size: 12.5px;
			color: var(--sc-text-2);
		}

		&-tip {
			margin-top: 14px;
			font-size: 11.5px;
			color: var(--sc-text-3);
		}
	}
}
</style>
