<!-- 数据大屏 -->
<template>
	<div class="screen" v-loading="loading">
		<!-- 头部 -->
		<header class="screen__header">
			<div class="screen__header-left">
				<ElButton text class="screen__back" @click="router.push('/home/')">
					<ElIcon><Back /></ElIcon>
				</ElButton>
				<div class="screen__title">
					<span class="screen__title-main">智慧校园运行态势</span>
					<span class="screen__title-sub">SMART CAMPUS · OVERVIEW</span>
				</div>
			</div>
			<div class="screen__header-right">
				<span class="screen__clock">{{ clock.time }}</span>
				<span class="screen__date">{{ clock.date }}</span>
			</div>
		</header>

		<!-- 主体 -->
		<main class="screen__body">
			<!-- 左列 -->
			<section class="screen__col">
				<div class="screen-card screen-card--sm">
					<div class="screen-card__title">年级人数</div>
					<Echart :option="gradeOption" :height="150" />
				</div>

				<div class="screen-card screen-card--sm">
					<div class="screen-card__title">智能设备在线率</div>
					<div class="screen-devices">
						<div v-for="d in overview.deviceStatus || []" :key="d.name" class="screen-devices__item">
							<div class="screen-devices__row">
								<span>{{ d.name }}</span>
								<span class="screen-devices__num">
									<em>{{ d.online }}</em>/{{ d.total }}
								</span>
							</div>
							<div class="screen-devices__bar">
								<span :style="{ width: `${(d.online / d.total) * 100}%` }"></span>
							</div>
						</div>
					</div>
				</div>

				<div class="screen-card screen-card--grow">
					<div class="screen-card__title">班级平均分 TOP 8</div>
					<div class="screen-rank">
						<div v-for="(c, i) in (overview.classRank || []).slice(0, 8)" :key="c.className" class="screen-rank__item">
							<span class="screen-rank__no" :class="`is-${i + 1}`">{{ i + 1 }}</span>
							<span class="screen-rank__name">{{ c.className }}</span>
							<div class="screen-rank__bar">
								<span :style="{ width: `${(c.avgScore / 100) * 100}%` }"></span>
							</div>
							<span class="screen-rank__value">{{ c.avgScore }}</span>
						</div>
					</div>
				</div>
			</section>

			<!-- 中列 -->
			<section class="screen__col screen__col--center">
				<div class="screen-kpis">
					<div v-for="(c, i) in (overview.cards || []).slice(0, 4)" :key="c.label" class="screen-kpi">
						<div class="screen-kpi__label">{{ c.label }}</div>
						<div class="screen-kpi__value">
							{{ c.value }}<em>{{ c.unit }}</em>
						</div>
						<div v-if="c.trend !== undefined" class="screen-kpi__trend" :class="c.trend >= 0 ? 'is-up' : 'is-down'">
							{{ c.trend >= 0 ? "▲" : "▼" }} {{ Math.abs(c.trend) }}%
						</div>
					</div>
				</div>

				<div class="screen-card screen-card--grow">
					<div class="screen-card__title">
						近 7 天出勤趋势
						<span class="screen-card__extra">平均 {{ avgRate }}%</span>
					</div>
					<div class="screen-card__chart">
						<Echart :option="attendanceOption" height="100%" />
					</div>
				</div>

				<div class="screen-card screen-card--grow">
					<div class="screen-card__title">一卡通消费 / 充值（近 6 个月）</div>
					<div class="screen-card__chart">
						<Echart :option="consumeOption" height="100%" />
					</div>
				</div>
			</section>

			<!-- 右列 -->
			<section class="screen__col">
				<div class="screen-card screen-card--sm">
					<div class="screen-card__title">成绩分布</div>
					<Echart :option="scoreOption" :height="150" />
				</div>

				<div class="screen-card screen-card--grow">
					<div class="screen-card__title">实时预警</div>
					<div class="screen-alerts">
						<div v-for="(a, i) in overview.alerts || []" :key="i" class="screen-alerts__item" :class="`is-${a.level}`">
							<span class="screen-alerts__dot"></span>
							<div class="screen-alerts__main">
								<div class="screen-alerts__title">{{ a.title }}</div>
								<div class="screen-alerts__meta">{{ a.type }} · {{ a.time }}</div>
							</div>
						</div>
						<Empty v-if="!overview.alerts?.length" text="暂无预警" :padding="20" />
					</div>
				</div>

				<div class="screen-card screen-card--sm">
					<div class="screen-card__title">通知公告</div>
					<ul class="screen-notices">
						<li v-for="n in (overview.notices || []).slice(0, 5)" :key="n.id">
							<span class="screen-notices__dot"></span>
							<span class="screen-notices__title">{{ n.title }}</span>
							<span class="screen-notices__time">{{ String(n.publishTime).slice(5, 10) }}</span>
						</li>
					</ul>
				</div>
			</section>
		</main>
	</div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { Back } from "@element-plus/icons-vue";
import { ElButton, ElIcon } from "lmLibs/element-plus";
import Echart from "lmCmpsEcharts/Echart";
import Empty from "lmCmpsBasic/Empty";
import { $dashboardOverviewGet } from "lmApisCampus/api/dashboard";
import { sync } from "lmUtils/promise";
import { dayjs } from "lmUtils/time";

const router = useRouter();
const loading = ref(false);
const overview = ref<Record<string, any>>({});
const clock = ref({ time: "", date: "" });

let timer: ReturnType<typeof setInterval> | undefined;
const tick = () => {
	const now = dayjs();
	clock.value = {
		time: now.format("HH:mm:ss"),
		date: now.format("YYYY-MM-DD dddd")
	};
};

/* ---------------- 图表 ---------------- */
const AXIS = {
	axisLine: { lineStyle: { color: "rgba(120,170,255,0.25)" } },
	axisLabel: { color: "rgba(200,220,255,0.65)", fontSize: 11 },
	splitLine: { lineStyle: { color: "rgba(120,170,255,0.12)" } }
};

const gradeOption = computed(() => {
	const list = overview.value.gradeRank || [];
	return {
		grid: { left: 34, right: 12, top: 18, bottom: 24 },
		tooltip: { trigger: "axis" },
		xAxis: { type: "category", data: list.map((g: any) => g.grade), ...AXIS },
		yAxis: { type: "value", ...AXIS },
		series: [
			{
				type: "bar",
				barWidth: 20,
				data: list.map((g: any) => g.students),
				itemStyle: {
					borderRadius: [4, 4, 0, 0],
					color: {
						type: "linear",
						x: 0,
						y: 0,
						x2: 0,
						y2: 1,
						colorStops: [
							{ offset: 0, color: "#5CE1E6" },
							{ offset: 1, color: "rgba(22,93,255,0.35)" }
						]
					}
				}
			}
		]
	};
});

const attendanceOption = computed(() => {
	const list = overview.value.attendanceTrend || [];
	return {
		grid: { left: 44, right: 20, top: 24, bottom: 26 },
		tooltip: { trigger: "axis" },
		xAxis: { type: "category", data: list.map((t: any) => t.date), ...AXIS },
		yAxis: { type: "value", min: 80, max: 100, ...AXIS },
		series: [
			{
				type: "line",
				smooth: true,
				symbolSize: 6,
				data: list.map((t: any) => t.rate),
				lineStyle: { width: 2.5, color: "#5CE1E6", shadowColor: "rgba(92,225,230,0.6)", shadowBlur: 10 },
				itemStyle: { color: "#5CE1E6" },
				areaStyle: {
					color: {
						type: "linear",
						x: 0,
						y: 0,
						x2: 0,
						y2: 1,
						colorStops: [
							{ offset: 0, color: "rgba(92,225,230,0.35)" },
							{ offset: 1, color: "rgba(92,225,230,0)" }
						]
					}
				}
			}
		]
	};
});

const consumeOption = computed(() => {
	const list = (overview.value.consumeTrend || []).slice(-6);
	return {
		grid: { left: 52, right: 16, top: 28, bottom: 24 },
		tooltip: { trigger: "axis" },
		legend: { right: 0, top: 0, itemWidth: 10, itemHeight: 10, textStyle: { color: "rgba(200,220,255,0.7)", fontSize: 11 } },
		xAxis: { type: "category", data: list.map((d: any) => d.month), ...AXIS },
		yAxis: { type: "value", ...AXIS },
		series: [
			{
				name: "消费",
				type: "bar",
				barWidth: 12,
				data: list.map((d: any) => d.amount),
				itemStyle: { borderRadius: [3, 3, 0, 0], color: "#165DFF" }
			},
			{
				name: "充值",
				type: "bar",
				barWidth: 12,
				data: list.map((d: any) => d.recharge),
				itemStyle: { borderRadius: [3, 3, 0, 0], color: "#5CE1E6" }
			}
		]
	};
});

const scoreOption = computed(() => {
	const list = overview.value.scoreDistribution || [];
	return {
		tooltip: { trigger: "item" },
		legend: { bottom: 0, itemWidth: 8, itemHeight: 8, textStyle: { color: "rgba(200,220,255,0.65)", fontSize: 10 } },
		series: [
			{
				type: "pie",
				radius: ["48%", "72%"],
				center: ["50%", "42%"],
				label: { show: false },
				itemStyle: { borderColor: "rgba(6,20,40,0.9)", borderWidth: 2 },
				data: list.map((d: any) => ({ name: d.name, value: d.value, itemStyle: { color: d.color } }))
			}
		]
	};
});

const avgRate = computed(() => {
	const list = overview.value.attendanceTrend || [];
	if (!list.length) return "--";
	return (list.reduce((a: number, b: any) => a + b.rate, 0) / list.length).toFixed(1);
});

const load = async () => {
	loading.value = true;
	try {
		const [err, res] = await sync($dashboardOverviewGet());
		if (!err) overview.value = (res as any) || {};
	} finally {
		loading.value = false;
	}
};

onMounted(() => {
	tick();
	timer = setInterval(tick, 1000);
	load();
});

onBeforeUnmount(() => timer && clearInterval(timer));
</script>

<style lang="less">
.screen {
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 100vh;
	padding: 12px 16px 16px;
	background: #05122b;
	background-image: radial-gradient(1200px 500px at 50% -10%, rgba(22, 93, 255, 0.25), transparent 60%),
		radial-gradient(900px 400px at 100% 100%, rgba(92, 225, 230, 0.12), transparent 60%),
		linear-gradient(rgba(120, 170, 255, 0.05) 1px, transparent 1px),
		linear-gradient(90deg, rgba(120, 170, 255, 0.05) 1px, transparent 1px);
	background-size: auto, auto, 40px 40px, 40px 40px;
	color: #dbe7ff;
	overflow: hidden;

	&__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 56px;
		flex: 0 0 56px;
		padding: 0 8px;
		border-bottom: 1px solid rgba(120, 170, 255, 0.16);
	}

	&__header-left {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	&__back {
		color: rgba(200, 220, 255, 0.7);

		&:hover {
			color: #fff;
		}
	}

	&__title {
		display: flex;
		flex-direction: column;

		&-main {
			font-size: 21px;
			font-weight: 700;
			letter-spacing: 3px;
			background: linear-gradient(180deg, #ffffff, #7fb0ff);
			-webkit-background-clip: text;
			background-clip: text;
			color: transparent;
		}

		&-sub {
			font-size: 10px;
			letter-spacing: 2px;
			color: rgba(150, 180, 230, 0.55);
		}
	}

	&__header-right {
		display: flex;
		align-items: baseline;
		gap: 12px;
	}

	&__clock {
		font-size: 20px;
		font-weight: 600;
		color: #5ce1e6;
		font-variant-numeric: tabular-nums;
		text-shadow: 0 0 12px rgba(92, 225, 230, 0.5);
	}

	&__date {
		font-size: 12px;
		color: rgba(200, 220, 255, 0.6);
	}

	&__body {
		flex: 1;
		display: grid;
		grid-template-columns: 300px minmax(0, 1fr) 320px;
		gap: 12px;
		min-height: 0;
		padding-top: 12px;
	}

	&__col {
		display: flex;
		flex-direction: column;
		gap: 12px;
		min-height: 0;

		&--center {
			min-width: 0;
		}
	}
}

.screen-card {
	position: relative;
	display: flex;
	flex-direction: column;
	padding: 10px 12px 8px;
	background: linear-gradient(180deg, rgba(16, 40, 82, 0.72), rgba(8, 24, 52, 0.55));
	border: 1px solid rgba(90, 150, 255, 0.18);
	border-radius: 8px;
	backdrop-filter: blur(2px);
	box-shadow: inset 0 0 24px rgba(22, 93, 255, 0.08);

	&::before,
	&::after {
		content: "";
		position: absolute;
		width: 10px;
		height: 10px;
		border-color: rgba(92, 225, 230, 0.6);
		border-style: solid;
	}

	&::before {
		left: -1px;
		top: -1px;
		border-width: 1px 0 0 1px;
	}

	&::after {
		right: -1px;
		bottom: -1px;
		border-width: 0 1px 1px 0;
	}

	&--sm {
		flex: 0 0 auto;
	}

	&--grow {
		flex: 1;
		min-height: 0;
	}

	&__title {
		position: relative;
		padding-left: 12px;
		margin-bottom: 6px;
		font-size: 13.5px;
		font-weight: 600;
		color: #cfe0ff;
		letter-spacing: 0.5px;

		&::before {
			content: "";
			position: absolute;
			left: 0;
			top: 50%;
			transform: translateY(-50%);
			width: 3px;
			height: 12px;
			border-radius: 2px;
			background: #5ce1e6;
			box-shadow: 0 0 8px rgba(92, 225, 230, 0.8);
		}
	}

	&__extra {
		float: right;
		font-size: 11.5px;
		font-weight: 400;
		color: rgba(200, 220, 255, 0.55);
	}

	&__chart {
		flex: 1;
		min-height: 0;
		display: flex;

		.n-echart {
			flex: 1;
			min-height: 0;
		}
	}
}

.screen-kpis {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 12px;
}

.screen-kpi {
	position: relative;
	padding: 12px 14px;
	background: linear-gradient(180deg, rgba(16, 40, 82, 0.75), rgba(8, 24, 52, 0.5));
	border: 1px solid rgba(90, 150, 255, 0.18);
	border-radius: 8px;
	overflow: hidden;

	&::after {
		content: "";
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 2px;
		background: linear-gradient(90deg, transparent, #5ce1e6, transparent);
		opacity: 0.7;
	}

	&__label {
		font-size: 12px;
		color: rgba(200, 220, 255, 0.6);
	}

	&__value {
		margin-top: 4px;
		font-size: 26px;
		font-weight: 700;
		color: #fff;
		font-variant-numeric: tabular-nums;
		text-shadow: 0 0 16px rgba(92, 225, 230, 0.4);

		em {
			margin-left: 3px;
			font-size: 12px;
			font-style: normal;
			font-weight: 400;
			color: rgba(200, 220, 255, 0.55);
		}
	}

	&__trend {
		margin-top: 2px;
		font-size: 11px;

		&.is-up {
			color: #5ce1e6;
		}

		&.is-down {
			color: #ff7d7d;
		}
	}
}

.screen-devices {
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: 4px 0;

	&__row {
		display: flex;
		justify-content: space-between;
		font-size: 12px;
		color: rgba(200, 220, 255, 0.7);
		margin-bottom: 4px;
	}

	&__num em {
		font-style: normal;
		color: #5ce1e6;
		font-weight: 600;
	}

	&__bar {
		height: 6px;
		border-radius: 3px;
		background: rgba(120, 170, 255, 0.16);
		overflow: hidden;

		span {
			display: block;
			height: 100%;
			border-radius: 3px;
			background: linear-gradient(90deg, #165dff, #5ce1e6);
		}
	}
}

.screen-rank {
	display: flex;
	flex-direction: column;
	gap: 8px;
	overflow: auto;
	padding-right: 2px;

	&__item {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
	}

	&__no {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 17px;
		height: 17px;
		border-radius: 4px;
		background: rgba(120, 170, 255, 0.16);
		color: rgba(200, 220, 255, 0.7);
		font-size: 10.5px;

		&.is-1 {
			background: rgba(255, 186, 30, 0.25);
			color: #ffcf5c;
		}

		&.is-2 {
			background: rgba(206, 220, 255, 0.2);
			color: #dfe8ff;
		}

		&.is-3 {
			background: rgba(255, 132, 66, 0.22);
			color: #ffab7a;
		}
	}

	&__name {
		width: 68px;
		color: rgba(200, 220, 255, 0.75);
		white-space: nowrap;
	}

	&__bar {
		flex: 1;
		height: 6px;
		border-radius: 3px;
		background: rgba(120, 170, 255, 0.14);
		overflow: hidden;

		span {
			display: block;
			height: 100%;
			border-radius: 3px;
			background: linear-gradient(90deg, rgba(22, 93, 255, 0.9), #5ce1e6);
		}
	}

	&__value {
		width: 34px;
		text-align: right;
		color: #5ce1e6;
		font-variant-numeric: tabular-nums;
	}
}

.screen-alerts {
	display: flex;
	flex-direction: column;
	gap: 8px;
	overflow: auto;

	&__item {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		padding: 8px 10px;
		border-radius: 6px;
		background: rgba(120, 170, 255, 0.08);
		border-left: 2px solid #165dff;

		&.is-warning {
			border-left-color: #ffb65d;
			background: rgba(255, 182, 93, 0.08);
		}

		&.is-danger {
			border-left-color: #ff6b6b;
			background: rgba(255, 107, 107, 0.08);
		}
	}

	&__dot {
		width: 6px;
		height: 6px;
		margin-top: 5px;
		border-radius: 50%;
		background: #5ce1e6;
		box-shadow: 0 0 8px rgba(92, 225, 230, 0.8);
	}

	&__title {
		font-size: 12.5px;
		color: rgba(215, 232, 255, 0.9);
		line-height: 1.5;
	}

	&__meta {
		margin-top: 2px;
		font-size: 10.5px;
		color: rgba(150, 180, 230, 0.55);
	}
}

.screen-notices {
	display: flex;
	flex-direction: column;
	gap: 6px;

	li {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
	}

	&__dot {
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: rgba(92, 225, 230, 0.8);
	}

	&__title {
		flex: 1;
		color: rgba(200, 220, 255, 0.75);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	&__time {
		color: rgba(150, 180, 230, 0.5);
		font-size: 11px;
	}
}

@media (max-width: 1400px) {
	.screen__body {
		grid-template-columns: 260px minmax(0, 1fr) 280px;
	}
}
</style>
