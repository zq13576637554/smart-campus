<!-- 校园一卡通 -->
<template>
	<div class="page-container card-page">
		<!-- 指标 + 图表 -->
		<div class="card-page__head">
			<NCard title="资金概览" class="card-page__chart">
				<div class="card-page__fund">
					<div v-for="item in statCards" :key="item.label" class="card-page__fund-item">
						<span class="card-page__fund-label">{{ item.label }}</span>
						<span class="card-page__fund-value">{{ item.prefix }}{{ item.value }}<em>{{ item.unit }}</em></span>
					</div>
				</div>
			</NCard>
			<NCard title="消费场景占比" class="card-page__chart">
				<Echart :option="placeOption" :height="180" />
			</NCard>
			<NCard title="月度消费 / 充值" class="card-page__chart">
				<Echart :option="monthOption" :height="180" />
			</NCard>
		</div>

		<div class="card-page__body">
			<ElTabs v-model="activeTab" class="card-page__tabs">
				<ElTabPane label="交易流水" name="tx">
					<NPageBasic
						ref="txPageRef"
						title="交易流水"
						row-key="id"
						:bars="txBars"
						:cols="txCols"
						:api="fetchTx"
						:is-show-more-filter="true"
					/>
				</ElTabPane>

				<ElTabPane label="卡片管理" name="card">
					<NPageBasic
						ref="cardPageRef"
						title="校园卡"
						row-key="id"
						:bars="cardBars"
						:cols="cardCols"
						:api="fetchCard"
						@on-tb-event-watch="onCardAction"
					>
						<template #handle-buttons>
							<ElButton type="primary" @click="openRecharge()">卡片充值</ElButton>
						</template>
					</NPageBasic>
				</ElTabPane>
			</ElTabs>
		</div>

		<Dialog v-model="rechargeVisible" title="校园卡充值" :loading="submitting" width="460px" @ok="onRecharge">
			<Form ref="formRef" :items="rechargeItems" :form-data="rechargeData" :show-footer="false" label-width="90px" />
		</Dialog>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElButton, ElMessage, ElTabPane, ElTabs } from "lmLibs/element-plus";
import NPageBasic from "lmCmpsBiz/NPageBasic";
import NCard from "lmCmpsBasic/NCard";
import Dialog from "lmCmpsBasic/Dialog";
import Form from "lmCmpsBasic/Form";
import Echart from "lmCmpsEcharts/Echart";
import type { FormItem } from "lmCmpsBasic/Form/types";
import { Input, Select } from "lmIreposF";
import { useSimpleCols } from "lmHooks/tools/useCols";
import { useSimpleBars } from "lmHooks/tools/useBars";
import { $cardPagePost, $cardRechargePost, $cardStatisticsGet, $cardTxPagePost } from "lmApisCampus/api/staff";
import { sync } from "lmUtils/promise";
import { thousands } from "lmUtils/fmt";

const txPageRef = ref();
const cardPageRef = ref();
const formRef = ref();
const activeTab = ref("tx");
const stats = ref<Record<string, any>>({});
const rechargeVisible = ref(false);
const submitting = ref(false);

const statCards = computed(() => [
	{ label: "卡内总余额", value: thousands(stats.value.totalBalance || 0, 2), prefix: "¥", unit: "" },
	{ label: "累计消费", value: thousands(stats.value.consumeAmount || 0, 0), prefix: "¥", unit: "" },
	{ label: "累计充值", value: thousands(stats.value.rechargeAmount || 0, 0), prefix: "¥", unit: "" }
]);

const txBars = computed(() =>
	useSimpleBars([
		"学生姓名|name|input",
		"卡号|cardNo|input",
		{
			bar: "交易类型|bizType|enum-type:CARD_BIZ_TYPE",
			config: { itemValue: "" }
		},
		{
			bar: "交易时间|time|date-type:daterange-startKey:startTime-endKey:endTime",
			config: { props: { format: "YYYY/MM/DD", valueFormat: "YYYY-MM-DD" } }
		}
	])
);

const txCols = computed(() =>
	useSimpleCols([
		"idx",
		"学生姓名|name|text|minWidth:100",
		"卡号|cardNo|minWidth:170",
		{
			col: "交易类型|bizType|tag|minWidth:100",
			setComProps: { dictType: "CARD_BIZ_TYPE" }
		},
		{
			col: "交易金额|amount|text|minWidth:110",
			tdFn: (h: any, ctx: any) => {
				const { row } = ctx.data;
				const positive = Number(row.amount) > 0;
				return h(
					"span",
					{ style: { color: positive ? "#00B42A" : "#F53F3F", fontWeight: 600 } },
					`${positive ? "+" : ""}${Number(row.amount).toFixed(2)}`
				);
			}
		},
		"卡内余额|balance|text|minWidth:110-format:number",
		"消费地点|place|minWidth:140",
		"交易时间|time|minWidth:170"
	])
);

const cardBars = computed(() =>
	useSimpleBars([
		"学生姓名|name|input",
		"卡号|cardNo|input",
		{
			bar: "卡片状态|status|select",
			config: {
				props: {
					options: [
						{ label: "正常", value: "NORMAL" },
						{ label: "已冻结", value: "FROZEN" }
					]
				}
			}
		}
	])
);

const cardCols = computed(() =>
	useSimpleCols([
		"idx",
		"学生姓名|name|text|minWidth:100",
		"卡号|cardNo|minWidth:170",
		"班级|className|minWidth:110",
		{
			col: "余额|balance|text|minWidth:110",
			tdFn: (h: any, ctx: any) => {
				const { row } = ctx.data;
				const low = Number(row.balance) < 20;
				return h("span", { style: { color: low ? "#F53F3F" : "#1D2129", fontWeight: 600 } }, `¥${Number(row.balance).toFixed(2)}${low ? "（余额不足）" : ""}`);
			}
		},
		{
			col: "卡片状态|status|tag|minWidth:100",
			setComProps: (row: any) => ({ type: row.status === "NORMAL" ? "success" : "danger", text: row.status === "NORMAL" ? "正常" : "已冻结" })
		},
		"开卡日期|openDate|minWidth:120",
		{ col: "actions|充值:recharge", setComProps: { fixed: "right", minWidth: 100 } }
	])
);

const placeOption = computed(() => {
	const list = (stats.value.byPlace || []).slice(0, 6);
	return {
		tooltip: { trigger: "item", formatter: "{b}: ¥{c} ({d}%)" },
		legend: { bottom: 0, type: "scroll", itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 11 } },
		series: [
			{
				type: "pie",
				radius: ["42%", "66%"],
				center: ["50%", "42%"],
				label: { show: false },
				itemStyle: { borderColor: "#fff", borderWidth: 2 },
				data: list.map((d: any, i: number) => ({
					name: d.name,
					value: d.value,
					itemStyle: { color: ["#165DFF", "#00B42A", "#FF7D00", "#722ED1", "#0FC6C2", "#F53F3F"][i % 6] }
				}))
			}
		]
	};
});

const monthOption = computed(() => {
	const list = (stats.value.monthly || []).slice(6);
	return {
		grid: { left: 46, right: 12, top: 26, bottom: 24 },
		tooltip: { trigger: "axis" },
		legend: { right: 0, top: 0, itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11 } },
		xAxis: { type: "category", data: list.map((d: any) => d.month), axisLabel: { color: "#86909c" }, axisLine: { lineStyle: { color: "#e5e6eb" } } },
		yAxis: { type: "value", splitLine: { lineStyle: { color: "#f2f3f5" } }, axisLabel: { color: "#86909c" } },
		series: [
			{ name: "消费", type: "line", smooth: true, data: list.map((d: any) => d.amount), itemStyle: { color: "#165DFF" } },
			{ name: "充值", type: "line", smooth: true, data: list.map((d: any) => d.recharge), itemStyle: { color: "#00B42A" } }
		]
	};
});

const fetchTx = (params: Record<string, any>) => $cardTxPagePost(params);
const fetchCard = (params: Record<string, any>) => $cardPagePost(params);

/* ---------------- 充值 ---------------- */
const rechargeData = reactive<Record<string, any>>({ id: "", name: "", cardNo: "", amount: 100 });

const rechargeItems = computed<FormItem[]>(() => [
	Input({ label: "学生姓名", prop: "name", yours: { disabled: true } }),
	Input({ label: "卡号", prop: "cardNo", yours: { disabled: true } }),
	Select({
		label: "充值金额",
		prop: "amount",
		colProps: { span: 24 },
		options: [50, 100, 200, 500, 1000].map(v => ({ label: `¥ ${v}`, value: v })),
		rules: [{ required: true, message: "请选择充值金额", trigger: "change" }],
		yours: { placeholder: "请选择充值金额" }
	})
]);

const openRecharge = (row?: any) => {
	Object.assign(rechargeData, {
		id: row?.id || "",
		name: row?.name || "",
		cardNo: row?.cardNo || "",
		amount: 100
	});
	rechargeVisible.value = true;
};

const onRecharge = async () => {
	const valid = await formRef.value?.__validForm?.();
	if (!valid) return;
	submitting.value = true;
	try {
		const [err] = await sync($cardRechargePost({ id: rechargeData.id, cardNo: rechargeData.cardNo, amount: rechargeData.amount }));
		if (err) return;
		ElMessage.success(`充值成功：¥${rechargeData.amount}`);
		rechargeVisible.value = false;
		cardPageRef.value?.doSearch(true, "search");
		txPageRef.value?.doSearch(false, "search");
		loadStats();
	} finally {
		submitting.value = false;
	}
};

const onCardAction = ({ key, data }: any) => {
	if (key === "recharge") openRecharge(data?.data?.row);
};

const loadStats = async () => {
	const [err, res] = await sync($cardStatisticsGet());
	if (!err) stats.value = (res as any) || {};
};

onMounted(loadStats);
</script>

<style lang="less">
.card-page {
	&__head {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 12px;
	}

	&__fund {
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		height: 180px;

		&-item {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 8px 0;
			border-bottom: 1px dashed #f2f3f5;

			&:last-child {
				border-bottom: none;
			}
		}

		&-label {
			font-size: 13px;
			color: #86909c;
		}

		&-value {
			font-size: 20px;
			font-weight: 600;
			color: #1d2129;
			font-variant-numeric: tabular-nums;

			em {
				margin-left: 2px;
				font-size: 12px;
				font-style: normal;
				font-weight: 400;
				color: #86909c;
			}
		}
	}

	&__chart {
		height: 100%;
	}

	&__body {
		flex: 1;
		min-height: 0;
	}

	&__tabs {
		height: 100%;
		display: flex;
		flex-direction: column;

		:deep(.el-tabs__content) {
			flex: 1;
			min-height: 0;
		}

		:deep(.el-tab-pane) {
			height: 100%;
			display: flex;
		}
	}
}

@media (max-width: 1200px) {
	.card-page__head {
		grid-template-columns: 1fr;
	}
}
</style>
