<!-- 首页驾驶舱 -->
<template>
	<div class="home-page" v-loading="loading">
		<!-- 欢迎条 -->
		<div class="home-page__banner">
			<div class="home-page__banner-left">
				<h2>{{ greeting }}，{{ userInfo.nickName || "管理员" }}</h2>
				<p>
					今天是 {{ today }} · {{ week }}，全校共有
					<strong>{{ overview.cards?.[0]?.value || 0 }}</strong> 名学生在读，
					<strong>{{ overview.alerts?.length || 0 }}</strong> 条待处理预警
				</p>
			</div>
			<div class="home-page__quick">
				<div v-for="item in quickLinks" :key="item.path" class="home-page__quick-item" @click="router.push(item.path)">
					<NIcon :name="item.icon" :size="18" />
					<span>{{ item.title }}</span>
				</div>
			</div>
		</div>

		<!-- 指标卡 -->
		<NSummaryCard :summary-data="overview.cards || []" />

		<!-- 趋势 + 分布 -->
		<ElRow :gutter="12" class="mt-12">
			<ElCol :xs="24" :lg="16">
				<NCard title="近 7 天出勤趋势" class="home-page__card">
					<Echart :option="attendanceOption" :height="280" />
				</NCard>
			</ElCol>
			<ElCol :xs="24" :lg="8">
				<NCard title="成绩分布" class="home-page__card">
					<Echart :option="scoreOption" :height="280" />
				</NCard>
			</ElCol>
		</ElRow>

		<!-- 消费 / 排名 / 设备 -->
		<ElRow :gutter="12" class="mt-12">
			<ElCol :xs="24" :lg="8">
				<NCard title="一卡通月度消费" class="home-page__card">
					<Echart :option="consumeOption" :height="240" />
				</NCard>
			</ElCol>
			<ElCol :xs="24" :lg="8">
				<NCard title="班级平均分排名" class="home-page__card">
					<div class="home-page__rank">
						<div v-for="(item, index) in overview.classRank" :key="item.className" class="home-page__rank-item">
							<span class="home-page__rank-no" :class="index < 3 ? `is-top${index + 1}` : ''">{{ index + 1 }}</span>
							<span class="home-page__rank-name">{{ item.className }}</span>
							<div class="home-page__rank-bar">
								<span :style="{ width: `${(item.avgScore / 100) * 100}%` }"></span>
							</div>
							<span class="home-page__rank-value">{{ item.avgScore }}</span>
						</div>
					</div>
				</NCard>
			</ElCol>
			<ElCol :xs="24" :lg="8">
				<NCard title="智能设备在线率" class="home-page__card">
					<div class="home-page__devices">
						<div v-for="dev in overview.deviceStatus" :key="dev.name" class="home-page__device">
							<div class="home-page__device-head">
								<span>{{ dev.name }}</span>
								<span class="home-page__device-num">{{ dev.online }}/{{ dev.total }}</span>
							</div>
							<ElProgress
								:percentage="Math.round((dev.online / dev.total) * 100)"
								:stroke-width="8"
								:color="dev.online / dev.total > 0.95 ? '#00B42A' : '#FF7D00'"
							/>
						</div>
					</div>
				</NCard>
			</ElCol>
		</ElRow>

		<!-- 通知 + 预警 -->
		<ElRow :gutter="12" class="mt-12">
			<ElCol :xs="24" :lg="12">
				<NCard title="最新通知公告" class="home-page__card">
					<template #extra>
						<span class="home-page__more" @click="router.push('/tzgg/')">查看全部</span>
					</template>
					<ul class="home-page__notices">
						<li v-for="notice in overview.notices" :key="notice.id" @click="router.push({ path: '/tzgg/detail/', query: { id: notice.id } })">
							<NTag :type="noticeType(notice.type)" fill>{{ noticeTypeText(notice.type) }}</NTag>
							<span class="home-page__notice-title">{{ notice.title }}</span>
							<span class="home-page__notice-time">{{ notice.publishTime.slice(5, 10) }}</span>
						</li>
					</ul>
				</NCard>
			</ElCol>
			<ElCol :xs="24" :lg="12">
				<NCard title="实时预警" class="home-page__card">
					<template #extra>
						<span class="home-page__more" @click="router.push('/kqgl/')">考勤中心</span>
					</template>
					<div class="home-page__alerts">
						<div v-for="(alert, i) in overview.alerts" :key="i" class="home-page__alert" :class="`is-${alert.level}`">
							<span class="home-page__alert-dot"></span>
							<div class="home-page__alert-main">
								<div class="home-page__alert-title">{{ alert.title }}</div>
								<div class="home-page__alert-meta">{{ alert.type }} · {{ alert.time }}</div>
							</div>
						</div>
					</div>
				</NCard>
			</ElCol>
		</ElRow>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ElCol, ElProgress, ElRow } from "lmLibs/element-plus";
import NCard from "lmCmpsBasic/NCard";
import NTag from "lmCmpsBasic/NTag";
import NIcon from "lmCmpsBasic/NIcon";
import NSummaryCard from "lmCmpsBasic/NSummaryCard";
import Echart from "lmCmpsEcharts/Echart";
import { $dashboardOverviewGet } from "lmApisCampus/api/dashboard";
import { useAppStore } from "lmStore/modules/app";
import { dayjs } from "lmUtils/time";
import { weekText } from "lmUtils/time";

const router = useRouter();
const appStore = useAppStore();
const loading = ref(false);
const overview = ref<Record<string, any>>({});

const userInfo = computed(() => appStore.getUserInfo || {});
const today = dayjs().format("YYYY 年 MM 月 DD 日");
const week = weekText((dayjs().day() + 6) % 7);

const greeting = computed(() => {
	const hour = dayjs().hour();
	if (hour < 6) return "凌晨好";
	if (hour < 12) return "上午好";
	if (hour < 14) return "中午好";
	if (hour < 18) return "下午好";
	return "晚上好";
});

const quickLinks = [
	{ title: "学生档案", path: "/xsgl/", icon: "student" },
	{ title: "智能考勤", path: "/kqgl/", icon: "attendance" },
	{ title: "成绩分析", path: "/cjgl/", icon: "score" },
	{ title: "一卡通", path: "/ykt/", icon: "card" },
	{ title: "门禁安防", path: "/mjgl/", icon: "access" },
	{ title: "AI 助手", path: "/ai/", icon: "ai" }
];

const noticeType = (type: string) => (type === "WARNING" ? "danger" : type === "ANNOUNCEMENT" ? "info" : "primary");
const noticeTypeText = (type: string) => (type === "WARNING" ? "预警" : type === "ANNOUNCEMENT" ? "公告" : "通知");

/* ---------------- 图表配置 ---------------- */
const attendanceOption = computed(() => {
	const trend = overview.value.attendanceTrend || [];
	return {
		grid: { left: 40, right: 46, top: 30, bottom: 30 },
		tooltip: { trigger: "axis" },
		legend: { data: ["出勤率", "异常人次"], right: 10, top: 0, itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11 } },
		xAxis: { type: "category", data: trend.map((t: any) => t.date), axisLine: { lineStyle: { color: "#e5e6eb" } }, axisLabel: { color: "#86909c" } },
		yAxis: [
			{ type: "value", min: 80, max: 100, splitLine: { lineStyle: { color: "#f2f3f5" } }, axisLabel: { color: "#86909c", formatter: "{value}%" } },
			{ type: "value", splitLine: { show: false }, axisLabel: { color: "#86909c" } }
		],
		series: [
			{
				name: "出勤率",
				type: "line",
				smooth: true,
				symbolSize: 6,
				data: trend.map((t: any) => t.rate),
				itemStyle: { color: "#165DFF" },
				areaStyle: {
					color: {
						type: "linear",
						x: 0,
						y: 0,
						x2: 0,
						y2: 1,
						colorStops: [
							{ offset: 0, color: "rgba(22,93,255,0.25)" },
							{ offset: 1, color: "rgba(22,93,255,0.02)" }
						]
					}
				}
			},
			{ name: "异常人次", type: "bar", yAxisIndex: 1, barWidth: 12, data: trend.map((t: any) => t.abnormal), itemStyle: { color: "#FFB65D", borderRadius: [4, 4, 0, 0] } }
		]
	};
});

const scoreOption = computed(() => {
	const data = overview.value.scoreDistribution || [];
	return {
		tooltip: { trigger: "item" },
		legend: { bottom: 0, itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11, color: "#4e5969" } },
		series: [
			{
				type: "pie",
				radius: ["46%", "70%"],
				center: ["50%", "44%"],
				avoidLabelOverlap: true,
				label: { show: false },
				itemStyle: { borderColor: "#fff", borderWidth: 3 },
				data: data.map((d: any) => ({ name: d.name, value: d.value, itemStyle: { color: d.color } }))
			}
		]
	};
});

const consumeOption = computed(() => {
	const data = (overview.value.consumeTrend || []).slice(6);
	return {
		grid: { left: 46, right: 12, top: 30, bottom: 30 },
		tooltip: { trigger: "axis" },
		legend: { right: 0, top: 0, itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11 } },
		xAxis: { type: "category", data: data.map((d: any) => d.month), axisLine: { lineStyle: { color: "#e5e6eb" } }, axisLabel: { color: "#86909c" } },
		yAxis: { type: "value", splitLine: { lineStyle: { color: "#f2f3f5" } }, axisLabel: { color: "#86909c" } },
		series: [
			{ name: "消费额", type: "bar", barWidth: 14, data: data.map((d: any) => d.amount), itemStyle: { color: "#165DFF", borderRadius: [4, 4, 0, 0] } },
			{ name: "充值额", type: "bar", barWidth: 14, data: data.map((d: any) => d.recharge), itemStyle: { color: "#0FC6C2", borderRadius: [4, 4, 0, 0] } }
		]
	};
});

const loadData = async () => {
	loading.value = true;
	try {
		overview.value = await $dashboardOverviewGet({ campusId: appStore.getCampus?.id || "main" });
	} finally {
		loading.value = false;
	}
};

// 切换校区后刷新概览
watch(
	() => appStore.getCampus?.id,
	() => loadData()
);

onMounted(loadData);
</script>

<style lang="less">
.home-page {
	padding-bottom: 12px;

	&__banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 16px;
		padding: 20px 24px;
		margin-bottom: 12px;
		border-radius: 10px;
		background: linear-gradient(100deg, #165dff 0%, #4080ff 46%, #0fc6c2 120%);
		color: #fff;
		box-shadow: 0 8px 24px rgba(22, 93, 255, 0.22);

		h2 {
			margin: 0 0 6px;
			font-size: 21px;
			font-weight: 600;
		}

		p {
			margin: 0;
			font-size: 13px;
			color: rgba(255, 255, 255, 0.85);

			strong {
				font-size: 15px;
				color: #fff;
			}
		}
	}

	&__quick {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;

		&-item {
			display: flex;
			align-items: center;
			gap: 6px;
			padding: 8px 12px;
			font-size: 12.5px;
			border-radius: 8px;
			background: rgba(255, 255, 255, 0.16);
			cursor: pointer;
			transition: background 0.2s;

			&:hover {
				background: rgba(255, 255, 255, 0.3);
			}
		}
	}

	&__card {
		height: 100%;
	}

	&__more {
		color: #165dff;
		cursor: pointer;
	}

	&__notices {
		li {
			display: flex;
			align-items: center;
			gap: 10px;
			padding: 9px 0;
			border-bottom: 1px dashed #f2f3f5;
			cursor: pointer;

			&:last-child {
				border-bottom: none;
			}

			&:hover .home-page__notice-title {
				color: #165dff;
			}
		}
	}

	&__notice-title {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 13px;
		color: #1d2129;
	}

	&__notice-time {
		font-size: 12px;
		color: #86909c;
	}

	&__alerts {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	&__alert {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		padding: 10px 12px;
		border-radius: 8px;
		background: var(--sc-bg);

		&-dot {
			width: 8px;
			height: 8px;
			margin-top: 5px;
			border-radius: 50%;
			background: #165dff;
		}

		&.is-warning {
			background: var(--sc-warning-soft);

			.home-page__alert-dot {
				background: #ff7d00;
			}
		}

		&.is-danger {
			background: #ffece8;

			.home-page__alert-dot {
				background: #f53f3f;
			}
		}

		&-title {
			font-size: 13px;
			color: #1d2129;
		}

		&-meta {
			margin-top: 2px;
			font-size: 11px;
			color: #86909c;
		}
	}

	&__rank {
		display: flex;
		flex-direction: column;
		gap: 9px;

		&-item {
			display: flex;
			align-items: center;
			gap: 8px;
			font-size: 12.5px;
		}

		&-no {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 18px;
			height: 18px;
			border-radius: 4px;
			background: #f2f3f5;
			color: #86909c;
			font-size: 11px;

			&.is-top1 {
				background: #ffe8b3;
				color: #b87400;
			}

			&.is-top2 {
				background: #e8eaed;
				color: #6b7280;
			}

			&.is-top3 {
				background: #ffe0cc;
				color: #b25900;
			}
		}

		&-name {
			width: 74px;
			color: #4e5969;
			white-space: nowrap;
		}

		&-bar {
			flex: 1;
			height: 8px;
			border-radius: 4px;
			background: #f2f3f5;
			overflow: hidden;

			span {
				display: block;
				height: 100%;
				border-radius: 4px;
				background: linear-gradient(90deg, #165dff, #4080ff);
			}
		}

		&-value {
			width: 34px;
			text-align: right;
			font-variant-numeric: tabular-nums;
			color: #1d2129;
		}
	}

	&__devices {
		display: flex;
		flex-direction: column;
		gap: 14px;
		padding-top: 4px;
	}

	&__device {
		&-head {
			display: flex;
			justify-content: space-between;
			margin-bottom: 4px;
			font-size: 12.5px;
			color: #4e5969;
		}

		&-num {
			color: #86909c;
			font-variant-numeric: tabular-nums;
		}
	}
}
</style>
