<!-- 能耗监测 -->
<template>
	<div class="page-container energy-page">
		<div class="energy-page__stats">
			<div v-for="item in statCards" :key="item.label" class="energy-page__stat" :class="`is-${item.type}`">
				<div class="energy-page__stat-label">{{ item.label }}</div>
				<div class="energy-page__stat-value">{{ item.value }}<em>{{ item.unit }}</em></div>
			</div>
		</div>

		<ElRow :gutter="12">
			<ElCol :xs="24" :lg="14">
				<NCard title="近 12 天能耗趋势" class="energy-page__card">
					<Echart :option="trendOption" :height="210" />
				</NCard>
			</ElCol>
			<ElCol :xs="24" :lg="10">
				<NCard title="各楼栋能耗（12 天累计）" class="energy-page__card">
					<div v-for="b in stats.byBuilding || []" :key="b.name" class="energy-page__building">
						<span class="energy-page__building-name">{{ b.name }}</span>
						<div class="energy-page__building-bars">
							<div class="energy-page__building-bar">
								<span class="is-electric" :style="{ width: `${(b.electric / maxBuilding) * 100}%` }"></span>
							</div>
							<div class="energy-page__building-bar">
								<span class="is-water" :style="{ width: `${(b.water / maxBuildingWater) * 100}%` }"></span>
							</div>
						</div>
						<span class="energy-page__building-num">{{ b.electric }} / {{ b.water }}</span>
					</div>
					<div class="energy-page__legend">
						<span><i class="is-electric"></i>用电 kWh</span>
						<span><i class="is-water"></i>用水 t</span>
					</div>
				</NCard>
			</ElCol>
		</ElRow>

		<div class="energy-page__list">
			<NPageBasic
				ref="pageRef"
				title="能耗明细"
				row-key="id"
				:bars="bars"
				:cols="cols"
				:api="fetchData"
				:tb-props="{ maxHeight: '100%' }"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElCol, ElRow } from "lmLibs/element-plus";
import NPageBasic from "lmCmpsBiz/NPageBasic";
import NCard from "lmCmpsBasic/NCard";
import Echart from "lmCmpsEcharts/Echart";
import { useSimpleCols } from "lmHooks/tools/useCols";
import { useSimpleBars } from "lmHooks/tools/useBars";
import { $energyListGet, $energyStatisticsGet } from "lmApisCampus/api/life";
import { sync } from "lmUtils/promise";

const pageRef = ref();
const stats = ref<Record<string, any>>({});

const statCards = computed(() => [
	{ label: "累计用电", value: stats.value.electric || 0, unit: "kWh", type: "primary" },
	{ label: "累计用水", value: stats.value.water || 0, unit: "吨", type: "info" },
	{ label: "超阈值记录", value: stats.value.over || 0, unit: "条", type: "danger" },
	{ label: "监测楼栋", value: (stats.value.byBuilding || []).length, unit: "栋", type: "success" }
]);

const maxBuilding = computed(() => Math.max(...(stats.value.byBuilding || []).map((b: any) => b.electric), 1));
const maxBuildingWater = computed(() => Math.max(...(stats.value.byBuilding || []).map((b: any) => b.water), 1));

const bars = computed(() =>
	useSimpleBars([
		{
			bar: "楼栋|building|select",
			config: {
				props: {
					options: ["教学楼", "宿舍 A 栋", "宿舍 B 栋", "图书馆", "体育馆", "实验楼"].map(b => ({ label: b, value: b }))
				}
			}
		},
		{
			bar: "能耗类型|type|select",
			config: {
				props: {
					options: [
						{ label: "用电", value: "电" },
						{ label: "用水", value: "水" }
					]
				}
			}
		},
		{
			bar: "告警状态|status|select",
			config: {
				props: {
					options: [
						{ label: "正常", value: "NORMAL" },
						{ label: "超阈值", value: "OVER" }
					]
				}
			}
		}
	])
);

const cols = computed(() =>
	useSimpleCols([
		"idx",
		"楼栋|building|text|minWidth:130",
		{
			col: "类型|type|tag|minWidth:90",
			setComProps: (row: any) => ({ type: row.type === "电" ? "warning" : "primary", text: row.type === "电" ? "用电" : "用水" })
		},
		{
			col: "用量|value|text|minWidth:120",
			tdFn: (h: any, ctx: any) => h("span", { style: { fontWeight: 600 } }, `${ctx.data.row.value} ${ctx.data.row.unit}`)
		},
		{ col: "阈值|threshold|text|minWidth:120", tdFn: (h: any, ctx: any) => h("span", {}, `${ctx.data.row.threshold} ${ctx.data.row.unit}`) },
		"日期|date|minWidth:130",
		{
			col: "状态|status|tag|minWidth:100",
			setComProps: (row: any) => ({ type: row.status === "OVER" ? "danger" : "success", text: row.status === "OVER" ? "超阈值" : "正常" })
		}
	])
);

const trendOption = computed(() => {
	const trend = stats.value.trend || [];
	return {
		grid: { left: 56, right: 44, top: 34, bottom: 26 },
		tooltip: { trigger: "axis" },
		legend: { right: 0, top: 0, itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11 } },
		xAxis: { type: "category", data: trend.map((t: any) => t.date.slice(5)), axisLabel: { color: "#86909c" }, axisLine: { lineStyle: { color: "#e5e6eb" } } },
		yAxis: [
			{ type: "value", name: "kWh", nameTextStyle: { color: "#86909c", fontSize: 11 }, splitLine: { lineStyle: { color: "#f2f3f5" } }, axisLabel: { color: "#86909c" } },
			{ type: "value", name: "吨", nameTextStyle: { color: "#86909c", fontSize: 11 }, splitLine: { show: false }, axisLabel: { color: "#86909c" } }
		],
		series: [
			{
				name: "用电",
				type: "line",
				smooth: true,
				symbolSize: 6,
				data: trend.map((t: any) => t.electric),
				itemStyle: { color: "#FF7D00" },
				areaStyle: {
					color: {
						type: "linear",
						x: 0,
						y: 0,
						x2: 0,
						y2: 1,
						colorStops: [
							{ offset: 0, color: "rgba(255,125,0,0.18)" },
							{ offset: 1, color: "rgba(255,125,0,0)" }
						]
					}
				}
			},
			{ name: "用水", type: "line", yAxisIndex: 1, smooth: true, data: trend.map((t: any) => t.water), itemStyle: { color: "#165DFF" } }
		]
	};
});

const fetchData = (params: Record<string, any>) => $energyListGet(params);

onMounted(async () => {
	const [err, res] = await sync($energyStatisticsGet());
	if (!err) stats.value = (res as any) || {};
});
</script>

<style lang="less">
.energy-page {
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
		border-left: 3px solid var(--sc-primary);

		&.is-danger {
			border-left-color: var(--sc-danger);
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

	&__card {
		height: 100%;
	}

	&__building {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 8px;

		&-name {
			width: 76px;
			font-size: 12px;
			color: var(--sc-text-2);
			white-space: nowrap;
		}

		&-bars {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: 3px;
		}

		&-bar {
			height: 6px;
			border-radius: 3px;
			background: var(--sc-bg-sunken);
			overflow: hidden;

			span {
				display: block;
				height: 100%;
				border-radius: 3px;
			}

			.is-electric {
				background: linear-gradient(90deg, #ff9a3c, #ff7d00);
			}

			.is-water {
				background: linear-gradient(90deg, #7ba7ff, #165dff);
			}
		}

		&-num {
			width: 84px;
			text-align: right;
			font-size: 11.5px;
			color: var(--sc-text-3);
			font-variant-numeric: tabular-nums;
		}
	}

	&__legend {
		display: flex;
		gap: 16px;
		margin-top: 10px;
		padding-top: 10px;
		border-top: 1px dashed var(--sc-border);
		font-size: 11.5px;
		color: var(--sc-text-3);

		span {
			display: inline-flex;
			align-items: center;
			gap: 5px;
		}

		i {
			display: inline-block;
			width: 10px;
			height: 6px;
			border-radius: 3px;

			&.is-electric {
				background: #ff7d00;
			}

			&.is-water {
				background: #165dff;
			}
		}
	}

	&__list {
		flex: 1;
		min-height: 320px;
		display: flex;
	}
}
</style>
