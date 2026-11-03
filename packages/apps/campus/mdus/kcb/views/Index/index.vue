<!-- 课表管理 -->
<template>
	<div class="page-container">
		<div class="schedule-page__head">
			<div class="schedule-page__stats">
				<div v-for="item in stats" :key="item.label" class="schedule-page__stat">
					<span class="schedule-page__stat-label">{{ item.label }}</span>
					<span class="schedule-page__stat-value">{{ item.value }}<em>{{ item.unit }}</em></span>
				</div>
			</div>

			<div class="schedule-page__filters">
				<span class="schedule-page__filter-label">班级</span>
				<ElSelect v-model="classId" style="width: 180px" @change="loadSchedule">
					<ElOption v-for="c in classOptions" :key="c.value" :label="c.label" :value="c.value" />
				</ElSelect>
				<ElButton text @click="loadSchedule">
					<ElIcon><Refresh /></ElIcon>
					刷新
				</ElButton>
			</div>
		</div>

		<div class="schedule-page__body" v-loading="loading">
			<!-- 周课表 -->
			<div class="schedule-page__grid">
				<div class="schedule-page__grid-head">
					<div class="schedule-page__cell schedule-page__cell--head">节次</div>
					<div v-for="day in days" :key="day.value" class="schedule-page__cell schedule-page__cell--head">
						{{ day.label }}
						<span class="schedule-page__head-date">{{ day.date }}</span>
					</div>
				</div>

				<div v-for="(slot, slotIndex) in slots" :key="slotIndex" class="schedule-page__row">
					<div class="schedule-page__cell schedule-page__cell--slot">
						<span class="schedule-page__slot-no">第 {{ slotIndex + 1 }} 节</span>
						<span class="schedule-page__slot-time">{{ slot }}</span>
					</div>
					<div v-for="day in days" :key="day.value" class="schedule-page__cell">
						<div
							v-if="cellOf(day.value, slotIndex + 1)"
							class="schedule-page__course"
							:style="courseStyle(cellOf(day.value, slotIndex + 1))"
							@click="onCourseClick(cellOf(day.value, slotIndex + 1))"
						>
							<div class="schedule-page__course-name">{{ cellOf(day.value, slotIndex + 1).courseName }}</div>
							<div class="schedule-page__course-teacher">{{ cellOf(day.value, slotIndex + 1).teacherName }}</div>
							<div class="schedule-page__course-room">{{ cellOf(day.value, slotIndex + 1).room }}</div>
						</div>
						<div v-else class="schedule-page__empty">—</div>
					</div>
				</div>
			</div>

			<!-- 今日课程 -->
			<div class="schedule-page__today">
				<div class="schedule-page__today-head">今日课程</div>
				<div v-if="todayList.length" class="schedule-page__today-list">
					<div v-for="item in todayList" :key="item.id" class="schedule-page__today-item">
						<span class="schedule-page__today-dot" :style="{ background: colorOf(item.courseName) }"></span>
						<div class="schedule-page__today-main">
							<div class="schedule-page__today-name">{{ item.courseName }}</div>
							<div class="schedule-page__today-meta">{{ slots[item.slot - 1] }} · {{ item.teacherName }}</div>
						</div>
						<span class="schedule-page__today-room">{{ item.room }}</span>
					</div>
				</div>
				<Empty v-else text="今天没有排课" :padding="24" />

				<div class="schedule-page__legend">
					<div v-for="s in subjectLegend" :key="s.name" class="schedule-page__legend-item">
						<span :style="{ background: s.color }"></span>{{ s.name }}
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElButton, ElIcon, ElMessage, ElOption, ElSelect } from "lmLibs/element-plus";
import { Refresh } from "@element-plus/icons-vue";
import Empty from "lmCmpsBasic/Empty";
import { $classOptionsGet, $scheduleListGet, $scheduleOverviewGet } from "lmApisCampus/api/academic";
import { sync } from "lmUtils/promise";
import { dayjs } from "lmUtils/time";

const loading = ref(false);
const classId = ref("");
const classOptions = ref<{ label: string; value: string }[]>([]);
const schedules = ref<any[]>([]);
const overview = ref<Record<string, any>>({});

const slots = ["08:00-08:45", "08:55-09:40", "10:00-10:45", "10:55-11:40", "14:00-14:45", "14:55-15:40", "16:00-16:45", "16:55-17:40"];

const PALETTE = ["#165DFF", "#00B42A", "#FF7D00", "#722ED1", "#0FC6C2", "#F53F3F", "#3491FA", "#F7BA1E"];

const days = computed(() => {
	const today = dayjs();
	const monday = today.subtract((today.day() + 6) % 7, "day");
	return ["周一", "周二", "周三", "周四", "周五"].map((label, i) => ({
		label,
		value: i + 1,
		date: monday.add(i, "day").format("MM/DD")
	}));
});

const stats = computed(() => [
	{ label: "本周课时", value: schedules.value.length, unit: "节" },
	{ label: "开设课程", value: overview.value.totalCourses || 0, unit: "门" },
	{ label: "任课教师", value: overview.value.teachers || 0, unit: "人" },
	{ label: "使用教室", value: overview.value.rooms || 0, unit: "间" }
]);

/** 课程 -> 颜色 */
const colorOf = (name: string) => {
	const index = ["语文", "数学", "英语", "物理", "化学", "生物", "政治", "历史", "地理", "体育", "信息技术", "音乐", "美术"].findIndex(s => name?.includes(s));
	return PALETTE[(index < 0 ? 0 : index) % PALETTE.length];
};

const subjectLegend = computed(() =>
	Array.from(new Set(schedules.value.map(s => s.courseName)))
		.slice(0, 8)
		.map(name => ({ name, color: colorOf(name) }))
);

const courseStyle = (item: any) => {
	const color = colorOf(item.courseName);
	return {
		background: `${color}14`,
		borderLeft: `3px solid ${color}`,
		color
	};
};

const cellOf = (day: number, slot: number) => schedules.value.find(s => s.day === day && s.slot === slot);

const todayList = computed(() => {
	const day = dayjs().day() === 0 ? 7 : dayjs().day();
	return schedules.value.filter(s => s.day === day).sort((a, b) => a.slot - b.slot);
});

const onCourseClick = (item: any) => {
	ElMessage.info(`${item.courseName} · ${item.teacherName} · ${item.room} · ${slots[item.slot - 1]}`);
};

const loadSchedule = async () => {
	if (!classId.value) return;
	loading.value = true;
	try {
		const [err, res] = await sync($scheduleListGet({ classId: classId.value }));
		if (!err && res) schedules.value = (res as any).list || [];
	} finally {
		loading.value = false;
	}
};

onMounted(async () => {
	const [err, res] = await sync($classOptionsGet());
	if (!err) {
		classOptions.value = res as any;
		classId.value = (res as any)?.[0]?.value || "";
	}
	const [e2, r2] = await sync($scheduleOverviewGet());
	if (!e2) overview.value = r2 as any;
	await loadSchedule();
});
</script>

<style lang="less">
.schedule-page {
	&__head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 12px;
		padding: 14px 16px;
		background: var(--sc-card);
		border-radius: 8px;
	}

	&__stats {
		display: flex;
		gap: 28px;
	}

	&__stat {
		display: flex;
		flex-direction: column;

		&-label {
			font-size: 12px;
			color: #86909c;
		}

		&-value {
			font-size: 20px;
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

	&__filters {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	&__filter-label {
		font-size: 13px;
		color: #4e5969;
	}

	&__body {
		flex: 1;
		display: flex;
		gap: 12px;
		min-height: 0;
	}

	&__grid {
		flex: 1;
		background: var(--sc-card);
		border-radius: 8px;
		padding: 12px;
		overflow: auto;
	}

	&__grid-head,
	&__row {
		display: grid;
		grid-template-columns: 92px repeat(5, minmax(0, 1fr));
		gap: 6px;
		margin-bottom: 6px;
	}

	&__cell {
		min-height: 74px;
		border-radius: 6px;
		background: #fafbfc;
		padding: 4px;
		display: flex;
		flex-direction: column;

		&--head {
			min-height: 44px;
			align-items: center;
			justify-content: center;
			background: #f2f3f5;
			font-size: 13px;
			font-weight: 500;
			color: #4e5969;
			gap: 2px;
		}

		&--slot {
			align-items: center;
			justify-content: center;
			background: var(--sc-bg);
		}
	}

	&__head-date {
		font-size: 11px;
		color: #a0a6b0;
	}

	&__slot-no {
		font-size: 12px;
		color: #4e5969;
	}

	&__slot-time {
		margin-top: 2px;
		font-size: 10.5px;
		color: #a0a6b0;
	}

	&__course {
		height: 100%;
		padding: 6px 8px;
		border-radius: 5px;
		cursor: pointer;
		transition: transform 0.15s;

		&:hover {
			transform: translateY(-1px);
			box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
		}
	}

	&__course-name {
		font-size: 13px;
		font-weight: 600;
	}

	&__course-teacher,
	&__course-room {
		margin-top: 2px;
		font-size: 11px;
		opacity: 0.78;
	}

	&__empty {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #e5e6eb;
	}

	&__today {
		flex: 0 0 300px;
		background: var(--sc-card);
		border-radius: 8px;
		padding: 14px;
		overflow: auto;

		&-head {
			margin-bottom: 12px;
			font-size: 14px;
			font-weight: 600;
			color: #1d2129;
		}

		&-list {
			display: flex;
			flex-direction: column;
			gap: 8px;
		}

		&-item {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 9px 10px;
			border-radius: 6px;
			background: var(--sc-bg);
		}

		&-dot {
			width: 6px;
			height: 30px;
			border-radius: 3px;
		}

		&-main {
			flex: 1;
			min-width: 0;
		}

		&-name {
			font-size: 13px;
			color: #1d2129;
		}

		&-meta {
			font-size: 11px;
			color: #86909c;
		}

		&-room {
			font-size: 11px;
			color: #86909c;
		}
	}

	&__legend {
		display: flex;
		flex-wrap: wrap;
		gap: 8px 12px;
		margin-top: 16px;
		padding-top: 12px;
		border-top: 1px dashed #f2f3f5;

		&-item {
			display: flex;
			align-items: center;
			gap: 4px;
			font-size: 11px;
			color: #86909c;

			span {
				width: 8px;
				height: 8px;
				border-radius: 2px;
			}
		}
	}
}

@media (max-width: 1200px) {
	.schedule-page__today {
		display: none;
	}
}
</style>
