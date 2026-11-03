<!-- 门禁安防 -->
<template>
	<div class="page-container access-page">
		<div class="access-page__stats">
			<div v-for="item in statCards" :key="item.label" class="access-page__stat" :class="`is-${item.type}`">
				<div class="access-page__stat-label">{{ item.label }}</div>
				<div class="access-page__stat-value">{{ item.value }}<em>{{ item.unit }}</em></div>
			</div>
		</div>

		<ElRow :gutter="12">
			<ElCol :xs="24" :lg="14">
				<NCard title="今日时段通行分布" class="access-page__card">
					<Echart :option="hourlyOption" :height="200" />
				</NCard>
			</ElCol>
			<ElCol :xs="24" :lg="10">
				<NCard title="设备状态" class="access-page__card">
					<div class="access-page__devices">
						<div v-for="dev in devices" :key="dev.id" class="access-page__device">
							<span class="access-page__device-dot" :class="dev.status === 'ONLINE' ? 'is-online' : 'is-offline'"></span>
							<span class="access-page__device-name">{{ dev.name }}</span>
							<span class="access-page__device-status">{{ dev.status === "ONLINE" ? "在线" : "离线" }}</span>
						</div>
					</div>
				</NCard>
			</ElCol>
		</ElRow>

		<div class="access-page__list">
			<NPageBasic
				ref="pageRef"
				title="通行记录"
				row-key="id"
				:bars="bars"
				:cols="cols"
				:api="fetchData"
				:is-show-more-filter="true"
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
import { $accessDevicesGet, $accessPagePost, $accessStatisticsGet } from "lmApisCampus/api/staff";
import { sync } from "lmUtils/promise";

const pageRef = ref();
const stats = ref<Record<string, any>>({});
const devices = ref<any[]>([]);

const statCards = computed(() => [
	{ label: "通行记录", value: stats.value.total || 0, unit: "次", type: "primary" },
	{ label: "正常率", value: stats.value.normalRate || 0, unit: "%", type: "success" },
	{ label: "异常通行", value: stats.value.abnormal || 0, unit: "次", type: "danger" },
	{ label: "在线设备", value: devices.value.filter(d => d.status === "ONLINE").length, unit: "台", type: "warning" }
]);

const bars = computed(() =>
	useSimpleBars([
		"姓名|personName|input",
		"编号|personNo|input",
		{
			bar: "人员类型|personType|enum-type:PERSON_TYPE",
			config: { itemValue: "" }
		},
		{
			bar: "通行方向|direction|enum-type:ACCESS_DIRECTION",
			config: { itemValue: "" }
		},
		{
			bar: "通行状态|status|enum-type:ACCESS_STATUS",
			config: { itemValue: "" }
		},
		{
			bar: "通行时间|time|date-type:daterange-startKey:startTime-endKey:endTime",
			config: { props: { format: "YYYY/MM/DD", valueFormat: "YYYY-MM-DD" } }
		}
	])
);

const cols = computed(() =>
	useSimpleCols([
		"idx",
		"姓名|personName|text|minWidth:100",
		"编号|personNo|minWidth:120",
		{
			col: "人员类型|personType|tag|minWidth:100",
			setComProps: { dictType: "PERSON_TYPE" }
		},
		"通行设备|device|minWidth:150",
		{
			col: "方向|direction|tag|minWidth:90",
			setComProps: (row: any) => ({ type: row.direction === "IN" ? "success" : "info", text: row.direction === "IN" ? "进校" : "出校" })
		},
		"通行方式|method|text|minWidth:100",
		{
			col: "通行状态|status|tag|minWidth:100",
			setComProps: { dictType: "ACCESS_STATUS" }
		},
		"体温(℃)|temperature|text|minWidth:100",
		"通行时间|time|minWidth:170"
	])
);

const fetchData = (params: Record<string, any>) => $accessPagePost(params);

const hourlyOption = computed(() => {
	const list = stats.value.hourly || [];
	return {
		grid: { left: 40, right: 16, top: 20, bottom: 26 },
		tooltip: { trigger: "axis" },
		xAxis: { type: "category", data: list.map((d: any) => d.hour), axisLabel: { color: "#86909c" }, axisLine: { lineStyle: { color: "#e5e6eb" } } },
		yAxis: { type: "value", splitLine: { lineStyle: { color: "#f2f3f5" } }, axisLabel: { color: "#86909c" } },
		series: [
			{
				type: "bar",
				barWidth: 16,
				data: list.map((d: any) => d.value),
				itemStyle: {
					borderRadius: [4, 4, 0, 0],
					color: {
						type: "linear",
						x: 0,
						y: 0,
						x2: 0,
						y2: 1,
						colorStops: [
							{ offset: 0, color: "#4080FF" },
							{ offset: 1, color: "#165DFF" }
						]
					}
				}
			}
		]
	};
});

onMounted(async () => {
	const [err, res] = await sync($accessStatisticsGet());
	if (!err) stats.value = (res as any) || {};
	const [e2, r2] = await sync($accessDevicesGet());
	if (!e2) devices.value = (r2 as any) || [];
});
</script>

<style lang="less">
.access-page {
	overflow: auto;

	&__stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 12px;
	}

	&__stat {
		padding: 16px;
		background: var(--sc-card);
		border-radius: 8px;
		border-left: 3px solid #165dff;

		&.is-success {
			border-left-color: #00b42a;
		}

		&.is-danger {
			border-left-color: #f53f3f;
		}

		&.is-warning {
			border-left-color: #ff7d00;
		}

		&-label {
			font-size: 12px;
			color: #86909c;
		}

		&-value {
			margin-top: 4px;
			font-size: 22px;
			font-weight: 600;
			color: #1d2129;

			em {
				margin-left: 2px;
				font-size: 12px;
				font-style: normal;
				font-weight: 400;
				color: #86909c;
			}
		}
	}

	&__card {
		height: 100%;
	}

	&__devices {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 8px;
	}

	&__device {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 9px 10px;
		border-radius: 6px;
		background: var(--sc-bg);

		&-dot {
			width: 7px;
			height: 7px;
			border-radius: 50%;
			background: #00b42a;

			&.is-offline {
				background: #f53f3f;
			}
		}

		&-name {
			flex: 1;
			font-size: 12.5px;
			color: #1d2129;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		&-status {
			font-size: 11px;
			color: #86909c;
		}
	}

	&__list {
		flex: 1;
		min-height: 380px;
		display: flex;
	}
}
</style>
