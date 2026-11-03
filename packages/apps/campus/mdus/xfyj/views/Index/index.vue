<!-- 消费异常预警 -->
<template>
	<div class="page-container alert-page">
		<div class="alert-page__stats">
			<div v-for="item in statCards" :key="item.label" class="alert-page__stat" :class="`is-${item.type}`">
				<div class="alert-page__stat-label">{{ item.label }}</div>
				<div class="alert-page__stat-value">{{ item.value }}<em>{{ item.unit }}</em></div>
			</div>
			<NCard title="预警规则分布" class="alert-page__rules">
				<div v-for="r in stats.byRule || []" :key="r.name" class="alert-page__rule">
					<span class="alert-page__rule-name">{{ r.name }}</span>
					<div class="alert-page__rule-bar">
						<span :style="{ width: `${(r.value / (stats.total || 1)) * 100}%` }"></span>
					</div>
					<span class="alert-page__rule-value">{{ r.value }}</span>
				</div>
			</NCard>
		</div>

		<div class="alert-page__list">
			<NPageBasic
				ref="pageRef"
				title="预警记录"
				row-key="id"
				:bars="bars"
				:cols="cols"
				:api="fetchData"
				:is-show-more-filter="true"
				@on-tb-event-watch="onTbAction"
			/>
		</div>

		<Dialog v-model="handleVisible" title="处理预警" :loading="submitting" width="480px" @ok="submitHandle">
			<div class="alert-page__info">
				<div><span>学生</span><strong>{{ current.studentName }}（{{ current.studentNo }}）</strong></div>
				<div><span>预警规则</span><strong>{{ current.rule }}</strong></div>
				<div><span>涉及金额</span><strong>¥{{ current.amount }}（{{ current.count }} 笔）</strong></div>
				<div><span>触发时间</span><strong>{{ current.time }}</strong></div>
			</div>
			<ElForm :model="handleForm" label-width="90px">
				<ElFormItem label="处理结果">
					<ElRadioGroup v-model="handleForm.status">
						<ElRadio value="PROCESSING">跟进中</ElRadio>
						<ElRadio value="HANDLED">已处理</ElRadio>
					</ElRadioGroup>
				</ElFormItem>
				<ElFormItem label="处理说明">
					<ElInput v-model="handleForm.remark" type="textarea" :rows="3" placeholder="如：已联系家长核实，为正常消费" />
				</ElFormItem>
			</ElForm>
		</Dialog>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import {
	ElForm,
	ElFormItem,
	ElInput,
	ElMessage,
	ElRadio,
	ElRadioGroup
} from "lmLibs/element-plus";
import NPageBasic from "lmCmpsBiz/NPageBasic";
import NCard from "lmCmpsBasic/NCard";
import Dialog from "lmCmpsBasic/Dialog";
import { useSimpleCols } from "lmHooks/tools/useCols";
import { useSimpleBars } from "lmHooks/tools/useBars";
import { $alertHandlePost, $alertPagePost, $alertStatisticsGet } from "lmApisCampus/api/life";
import { sync } from "lmUtils/promise";

const pageRef = ref();
const stats = ref<Record<string, any>>({});
const handleVisible = ref(false);
const submitting = ref(false);
const current = ref<Record<string, any>>({});
const handleForm = reactive({ status: "HANDLED", remark: "已核实" });

const LEVEL: Record<string, { text: string; type: string }> = {
	HIGH: { text: "高风险", type: "danger" },
	MEDIUM: { text: "中风险", type: "warning" },
	LOW: { text: "低风险", type: "info" }
};

const STATUS: Record<string, { text: string; type: string }> = {
	PENDING: { text: "待处理", type: "danger" },
	PROCESSING: { text: "跟进中", type: "warning" },
	HANDLED: { text: "已处理", type: "success" }
};

const statCards = computed(() => [
	{ label: "预警总数", value: stats.value.total || 0, unit: "条", type: "primary" },
	{ label: "待处理", value: stats.value.pending || 0, unit: "条", type: "danger" },
	{ label: "高风险", value: stats.value.high || 0, unit: "条", type: "warning" },
	{ label: "已处理", value: stats.value.handled || 0, unit: "条", type: "success" }
]);

const bars = computed(() =>
	useSimpleBars([
		"学生姓名|studentName|input",
		"学号|studentNo|input",
		{
			bar: "风险等级|level|select",
			config: {
				props: {
					options: Object.keys(LEVEL).map(k => ({ label: LEVEL[k].text, value: k }))
				}
			}
		},
		{
			bar: "处理状态|status|select",
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
		"卡号|cardNo|minWidth:170",
		"预警规则|rule|minWidth:160",
		{
			col: "风险等级|level|tag|minWidth:100",
			setComProps: (row: any) => ({ type: LEVEL[row.level]?.type || "info", text: LEVEL[row.level]?.text || row.level })
		},
		{
			col: "涉及金额|amount|text|minWidth:120",
			tdFn: (h: any, ctx: any) => h("span", { style: { fontWeight: 600 } }, `¥${Number(ctx.data.row.amount).toFixed(2)}`)
		},
		{ col: "笔数|count|text|minWidth:80", tdFn: (h: any, ctx: any) => h("span", {}, `${ctx.data.row.count} 笔`) },
		"触发时间|time|minWidth:170",
		{
			col: "状态|status|tag|minWidth:100",
			setComProps: (row: any) => ({ type: STATUS[row.status]?.type || "info", text: STATUS[row.status]?.text || row.status })
		},
		{
			col: "actions|处理:handle",
			setComProps: {
				fixed: "right",
				width: 100,
				cmds: (row: any) => (row.status === "HANDLED" ? [] : [{ text: "处理", action: "handle" }])
			}
		}
	])
);

const fetchData = (params: Record<string, any>) => $alertPagePost(params);

const loadStats = async () => {
	const [err, res] = await sync($alertStatisticsGet());
	if (!err) stats.value = (res as any) || {};
};

const onTbAction = ({ key, data }: any) => {
	if (key !== "handle") return;
	current.value = data?.data?.row || {};
	handleForm.status = "HANDLED";
	handleForm.remark = "已核实";
	handleVisible.value = true;
};

const submitHandle = async () => {
	submitting.value = true;
	try {
		const [err] = await sync($alertHandlePost({ id: current.value.id, ...handleForm }));
		if (err) return;
		ElMessage.success("处理完成");
		handleVisible.value = false;
		pageRef.value.doSearch(true, "search");
		loadStats();
	} finally {
		submitting.value = false;
	}
};

onMounted(loadStats);
</script>

<style lang="less">
.alert-page {
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

		&.is-danger {
			border-left-color: var(--sc-danger);
		}

		&.is-warning {
			border-left-color: var(--sc-warning);
		}

		&.is-success {
			border-left-color: var(--sc-success);
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

	&__rules {
		grid-column: 1 / -1;
	}

	&__rule {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 8px;

		&:last-child {
			margin-bottom: 0;
		}

		&-name {
			width: 130px;
			font-size: 12.5px;
			color: var(--sc-text-2);
		}

		&-bar {
			flex: 1;
			height: 10px;
			border-radius: 5px;
			background: var(--sc-bg-sunken);
			overflow: hidden;

			span {
				display: block;
				height: 100%;
				border-radius: 5px;
				background: linear-gradient(90deg, var(--sc-warning), var(--sc-danger));
			}
		}

		&-value {
			width: 40px;
			text-align: right;
			font-size: 12.5px;
			color: var(--sc-text-2);
		}
	}

	&__list {
		flex: 1;
		min-height: 0;
		display: flex;
	}

	&__info {
		display: grid;
		gap: 8px;
		margin-bottom: 14px;
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

@media (max-width: 1400px) {
	.alert-page__stats {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
}
</style>
