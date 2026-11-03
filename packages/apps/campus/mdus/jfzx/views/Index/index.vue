<!-- 缴费中心 -->
<template>
	<div class="page-container bill-page">
		<div class="bill-page__stats">
			<div v-for="item in statCards" :key="item.label" class="bill-page__stat" :class="`is-${item.type}`">
				<div class="bill-page__stat-label">{{ item.label }}</div>
				<div class="bill-page__stat-value"><em v-if="item.prefix">{{ item.prefix }}</em>{{ fmt(item.value) }}<span v-if="item.unit">{{ item.unit }}</span></div>
			</div>
			<NCard title="各费用类型应收" class="bill-page__types">
				<div v-for="t in stats.byType || []" :key="t.name" class="bill-page__type">
					<span class="bill-page__type-name">{{ t.name }}</span>
					<div class="bill-page__type-bar">
						<span :style="{ width: `${(t.value / maxTypeValue) * 100}%` }"></span>
					</div>
					<span class="bill-page__type-value">¥{{ fmt(t.value) }}</span>
				</div>
			</NCard>
		</div>

		<div class="bill-page__list">
			<NPageBasic
				ref="pageRef"
				title="缴费账单"
				row-key="id"
				:bars="bars"
				:cols="cols"
				:api="fetchData"
				@on-tb-event-watch="onTbAction"
			/>
		</div>

		<Dialog v-model="payVisible" title="账单缴费" :loading="submitting" width="460px" @ok="submitPay">
			<div class="bill-page__info">
				<div><span>学生</span><strong>{{ current.studentName }}（{{ current.className }}）</strong></div>
				<div><span>费用类型</span><strong>{{ current.feeType }}</strong></div>
				<div><span>应收 / 已收</span><strong>¥{{ fmt(current.amount) }} / ¥{{ fmt(current.paid) }}</strong></div>
				<div><span>待缴金额</span><strong class="bill-page__due">¥{{ fmt((current.amount || 0) - (current.paid || 0)) }}</strong></div>
			</div>
			<ElForm :model="payForm" label-width="90px">
				<ElFormItem label="本次缴费">
					<ElInputNumber v-model="payForm.amount" :min="1" :max="(current.amount || 0) - (current.paid || 0)" style="width: 100%" />
				</ElFormItem>
				<ElFormItem label="支付方式">
					<ElRadioGroup v-model="payForm.method">
						<ElRadio value="WECHAT">微信</ElRadio>
						<ElRadio value="ALIPAY">支付宝</ElRadio>
						<ElRadio value="CASH">现金</ElRadio>
					</ElRadioGroup>
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
	ElInputNumber,
	ElMessage,
	ElRadio,
	ElRadioGroup
} from "lmLibs/element-plus";
import NPageBasic from "lmCmpsBiz/NPageBasic";
import NCard from "lmCmpsBasic/NCard";
import Dialog from "lmCmpsBasic/Dialog";
import { useSimpleCols } from "lmHooks/tools/useCols";
import { useSimpleBars } from "lmHooks/tools/useBars";
import { $billPagePost, $billPayPost, $billStatisticsGet } from "lmApisCampus/api/life";
import { sync } from "lmUtils/promise";
import { thousands } from "lmUtils/fmt";

const pageRef = ref();
const stats = ref<Record<string, any>>({});
const payVisible = ref(false);
const submitting = ref(false);
const current = ref<Record<string, any>>({});
const payForm = reactive({ amount: 0, method: "WECHAT" });

const fmt = (v: any) => thousands(Number(v || 0), 0);

const STATUS: Record<string, { text: string; type: string }> = {
	UNPAID: { text: "未缴费", type: "danger" },
	PARTIAL: { text: "部分缴费", type: "warning" },
	PAID: { text: "已缴清", type: "success" }
};

const FEE_TYPES = ["学费", "住宿费", "教材费", "校服费", "课后服务费", "餐费"];

const statCards = computed(() => [
	{ label: "应收总额", value: stats.value.total || 0, unit: "元", type: "primary", prefix: "¥" },
	{ label: "已收金额", value: stats.value.paid || 0, unit: "元", type: "success", prefix: "¥" },
	{ label: "欠费金额", value: stats.value.unpaid || 0, unit: "元", type: "danger", prefix: "¥" },
	{ label: "收缴率", value: stats.value.rate || 0, unit: "%", type: "warning", prefix: "" }
]);

const maxTypeValue = computed(() => Math.max(...(stats.value.byType || []).map((t: any) => t.value), 1));

const bars = computed(() =>
	useSimpleBars([
		"学生姓名|studentName|input",
		"学号|studentNo|input",
		{
			bar: "费用类型|feeType|select",
			config: { props: { options: FEE_TYPES.map(t => ({ label: t, value: t })) } }
		},
		{
			bar: "缴费状态|status|select",
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
		"学生姓名|studentName|text|minWidth:100",
		"学号|studentNo|minWidth:130",
		"班级|className|minWidth:110",
		"费用类型|feeType|minWidth:110",
		{ col: "应收(元)|amount|text|minWidth:110", tdFn: (h: any, ctx: any) => h("span", {}, thousands(ctx.data.row.amount, 0)) },
		{ col: "已收(元)|paid|text|minWidth:110", tdFn: (h: any, ctx: any) => h("span", {}, thousands(ctx.data.row.paid, 0)) },
		{
			col: "缴费进度|rate|progress|minWidth:150"
		},
		{
			col: "状态|status|tag|minWidth:100",
			setComProps: (row: any) => ({ type: STATUS[row.status]?.type || "info", text: STATUS[row.status]?.text || row.status })
		},
		"截止日期|dueDate|minWidth:120",
		{
			col: "actions|缴费:pay",
			setComProps: {
				fixed: "right",
				width: 100,
				cmds: (row: any) => (row.status === "PAID" ? [] : [{ text: "缴费", action: "pay" }])
			}
		}
	])
);

const fetchData = async (params: Record<string, any>) => {
	const res = await $billPagePost(params);
	return {
		...res,
		content: res.content.map((b: any) => ({ ...b, rate: Math.round((b.paid / b.amount) * 100) }))
	};
};

const loadStats = async () => {
	const [err, res] = await sync($billStatisticsGet());
	if (!err) stats.value = (res as any) || {};
};

const onTbAction = ({ key, data }: any) => {
	if (key !== "pay") return;
	current.value = data?.data?.row || {};
	payForm.amount = (current.value.amount || 0) - (current.value.paid || 0);
	payForm.method = "WECHAT";
	payVisible.value = true;
};

const submitPay = async () => {
	submitting.value = true;
	try {
		const [err] = await sync($billPayPost({ id: current.value.id, amount: payForm.amount }));
		if (err) return;
		ElMessage.success(`缴费成功 ¥${thousands(payForm.amount, 0)}`);
		payVisible.value = false;
		pageRef.value.doSearch(true, "search");
		loadStats();
	} finally {
		submitting.value = false;
	}
};

onMounted(loadStats);
</script>

<style lang="less">
.bill-page {
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

		&.is-warning {
			border-left-color: var(--sc-warning);
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
				margin-right: 2px;
				font-size: 13px;
				font-style: normal;
				font-weight: 500;
				color: var(--sc-text-3);
			}

			span {
				margin-left: 3px;
				font-size: 12px;
				font-weight: 400;
				color: var(--sc-text-3);
			}
		}
	}

	&__types {
		grid-column: 1 / -1;
	}

	&__type {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 8px;

		&:last-child {
			margin-bottom: 0;
		}

		&-name {
			width: 100px;
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
				background: linear-gradient(90deg, var(--sc-primary), #5ce1e6);
			}
		}

		&-value {
			width: 90px;
			text-align: right;
			font-size: 12.5px;
			color: var(--sc-text-2);
			font-variant-numeric: tabular-nums;
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
			flex: 0 0 84px;
			color: var(--sc-text-3);
		}

		strong {
			font-weight: 500;
			color: var(--sc-text-1);
		}
	}

	&__due {
		color: var(--sc-danger) !important;
	}
}

@media (max-width: 1400px) {
	.bill-page__stats {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
}
</style>
