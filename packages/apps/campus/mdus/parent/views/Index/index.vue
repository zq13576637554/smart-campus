<!-- 家长端（移动端 H5） -->
<template>
	<div class="parent">
		<!-- 顶部 -->
		<header class="parent__header">
			<div class="parent__header-top">
				<a class="parent__back" @click="router.push('/home/')">‹ 返回后台</a>
				<span class="parent__badge">家长端</span>
			</div>

			<div class="parent__child">
				<div class="parent__avatar">{{ (student.name || "学").slice(0, 1) }}</div>
				<div class="parent__child-info">
					<div class="parent__child-name">{{ student.name || "选择孩子" }}</div>
					<div class="parent__child-meta">
						{{ student.className || "--" }} · {{ student.studentNo || "--" }}
					</div>
				</div>
				<ElSelect v-model="studentNo" size="small" class="parent__child-select" @change="loadAll">
					<ElOption v-for="s in students" :key="s.value" :label="s.label" :value="s.value" />
				</ElSelect>
			</div>

			<div class="parent__kpis">
				<div class="parent__kpi">
					<strong>{{ avgScore }}</strong>
					<span>综合均分</span>
				</div>
				<div class="parent__kpi">
					<strong>{{ attendanceRate }}%</strong>
					<span>出勤率</span>
				</div>
				<div class="parent__kpi">
					<strong>{{ leaves.length }}</strong>
					<span>请假记录</span>
				</div>
			</div>
		</header>

		<!-- 内容 -->
		<main class="parent__body">
			<ElTabs v-model="tab" class="parent__tabs">
				<ElTabPane label="周报" name="weekly">
					<div v-if="weekly" class="parent__report">
						<div class="parent__report-head">
							<span class="parent__report-week">{{ weekly.week }}</span>
							<span class="parent__report-tag">本周报告</span>
						</div>

						<div class="parent__report-summary">{{ weekly.summary }}</div>

						<div class="parent__report-metrics">
							<div v-for="m in weekly.metrics" :key="m.label" class="parent__report-metric">
								<strong>{{ m.value }}<em>{{ m.unit }}</em></strong>
								<span>{{ m.label }}</span>
							</div>
						</div>

						<div class="parent__report-block">
							<div class="parent__report-block-title">本周亮点</div>
							<div
								v-for="(h, i) in weekly.highlights"
								:key="i"
								class="parent__report-item"
								:class="`is-${h.type}`"
							>
								<span class="parent__report-dot"></span>
								<div>
									<div class="parent__report-item-title">{{ h.title }}</div>
									<div class="parent__report-item-text">{{ h.text }}</div>
								</div>
							</div>
						</div>

						<div class="parent__report-block">
							<div class="parent__report-block-title">给家长的建议</div>
							<ul class="parent__report-advice">
								<li v-for="(a, i) in weekly.advice" :key="i">{{ a }}</li>
							</ul>
						</div>
					</div>
					<Empty v-else text="正在生成本周报告…" :padding="40" />
				</ElTabPane>

				<ElTabPane label="成绩" name="score">
					<div class="parent__card">
						<div v-for="s in scores" :key="s.id" class="parent__score">
							<span class="parent__score-name">{{ s.courseName }}</span>
							<div class="parent__score-bar">
								<span :style="{ width: `${s.score}%`, background: s.score >= 90 ? '#00B42A' : s.score >= 60 ? '#165DFF' : '#F53F3F' }"></span>
							</div>
							<span class="parent__score-value" :class="{ 'is-fail': s.score < 60 }">{{ s.score }}</span>
						</div>
						<Empty v-if="!scores.length" text="暂无成绩" :padding="30" />
					</div>
				</ElTabPane>

				<ElTabPane label="考勤" name="attendance">
					<div class="parent__card">
						<div v-for="a in attendances" :key="a.id" class="parent__row">
							<div>
								<div class="parent__row-title">{{ a.date }} {{ a.time }}</div>
								<div class="parent__row-sub">{{ a.device }} · {{ a.methodText }}</div>
							</div>
							<NTag :type="typeTag(a.type)" fill>{{ typeText(a.type) }}</NTag>
						</div>
						<Empty v-if="!attendances.length" text="暂无考勤记录" :padding="30" />
					</div>
				</ElTabPane>

				<ElTabPane label="请假" name="leave">
					<div class="parent__card">
						<div v-for="l in leaves" :key="l.id" class="parent__row">
							<div>
								<div class="parent__row-title">{{ l.type }} · {{ l.days }} 天</div>
								<div class="parent__row-sub">{{ l.startDate }} ~ {{ l.endDate }}</div>
								<div class="parent__row-sub">{{ l.reason }}</div>
							</div>
							<NTag :type="STATUS[l.status]?.type || 'info'" fill>{{ STATUS[l.status]?.text || l.status }}</NTag>
						</div>
						<Empty v-if="!leaves.length" text="暂无请假记录" :padding="30" />
					</div>
				</ElTabPane>

				<ElTabPane label="课表" name="schedule">
					<div class="parent__card">
						<div v-for="(item, i) in schedules" :key="i" class="parent__row">
							<div>
								<div class="parent__row-title">{{ item.courseName }}</div>
								<div class="parent__row-sub">
									周{{ item.day }} 第 {{ item.slot }} 节 · {{ item.teacherName }} · {{ item.room }}
								</div>
							</div>
						</div>
						<Empty v-if="!schedules.length" text="暂无课表" :padding="30" />
					</div>
				</ElTabPane>
			</ElTabs>
		</main>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ElOption, ElSelect, ElTabPane, ElTabs } from "lmLibs/element-plus";
import NTag from "lmCmpsBasic/NTag";
import Empty from "lmCmpsBasic/Empty";
import { $attendancePagePost, $scheduleListGet, $scorePagePost, $studentPagePost } from "lmApisCampus/api/academic";
import { $leavePagePost } from "lmApisCampus/api/system";
import { $aiParentReportPost } from "lmApisCampus/api/ai";
import { sync } from "lmUtils/promise";

const router = useRouter();

const students = ref<{ label: string; value: string }[]>([]);
const studentNo = ref("");
const student = ref<Record<string, any>>({});
const scores = ref<any[]>([]);
const attendances = ref<any[]>([]);
const leaves = ref<any[]>([]);
const schedules = ref<any[]>([]);
const weekly = ref<Record<string, any> | null>(null);
const tab = ref("weekly");

const STATUS: Record<string, { text: string; type: string }> = {
	PENDING: { text: "待审批", type: "warning" },
	APPROVED: { text: "已通过", type: "success" },
	REJECTED: { text: "已驳回", type: "danger" }
};

const ATT: Record<string, { text: string; type: string }> = {
	NORMAL: { text: "正常", type: "success" },
	LATE: { text: "迟到", type: "warning" },
	EARLY: { text: "早退", type: "warning" },
	ABSENT: { text: "缺勤", type: "danger" },
	LEAVE: { text: "请假", type: "info" }
};

const METHOD: Record<string, string> = {
	FACE: "人脸识别",
	CARD: "刷卡",
	QRCODE: "二维码",
	MANUAL: "手动"
};

const typeText = (t: string) => ATT[t]?.text || t;
const typeTag = (t: string) => ATT[t]?.type || "info";

const avgScore = computed(() => {
	if (!scores.value.length) return "--";
	return (scores.value.reduce((a, b) => a + b.score, 0) / scores.value.length).toFixed(1);
});

const attendanceRate = computed(() => {
	if (!attendances.value.length) return 100;
	const normal = attendances.value.filter(a => a.type === "NORMAL").length;
	return ((normal / attendances.value.length) * 100).toFixed(1);
});

const loadAll = async () => {
	if (!studentNo.value) return;
	const [err, res] = await sync($studentPagePost({ studentNo: studentNo.value, pageNumber: 1, pageSize: 1 }));
	if (err) return;
	student.value = (res as any).content?.[0] || {};

	const [e1, r1] = await sync($scorePagePost({ studentNo: studentNo.value, pageNumber: 1, pageSize: 20 }));
	if (!e1) scores.value = (r1 as any).content || [];

	const [e2, r2] = await sync($attendancePagePost({ studentNo: studentNo.value, pageNumber: 1, pageSize: 10 }));
	if (!e2) {
		attendances.value = ((r2 as any).content || []).map((a: any) => ({ ...a, methodText: METHOD[a.method] || a.method }));
	}

	const [e3, r3] = await sync($leavePagePost({ studentNo: studentNo.value, pageNumber: 1, pageSize: 10 }));
	if (!e3) leaves.value = (r3 as any).content || [];

	const classId = student.value?.classId;
	if (classId) {
		const [e4, r4] = await sync($scheduleListGet({ classId }));
		if (!e4) schedules.value = ((r4 as any).list || []).slice(0, 12);
	}

	const [e5, r5] = await sync($aiParentReportPost({ studentNo: studentNo.value }));
	weekly.value = e5 ? null : (r5 as any);
};

onMounted(async () => {
	const [err, res] = await sync($studentPagePost({ pageNumber: 1, pageSize: 20 }));
	if (!err) {
		students.value = (res as any).content.map((s: any) => ({ label: `${s.name}（${s.studentNo}）`, value: s.studentNo }));
		studentNo.value = students.value[0]?.value || "";
	}
	await loadAll();
});
</script>

<style lang="less">
.parent {
	max-width: 520px;
	min-height: 100vh;
	margin: 0 auto;
	background: var(--sc-bg);
	display: flex;
	flex-direction: column;

	&__header {
		padding: 14px 16px 18px;
		background: linear-gradient(135deg, #165dff, #4080ff 60%, #0fc6c2);
		color: #fff;
		border-radius: 0 0 18px 18px;
		box-shadow: 0 8px 20px rgba(22, 93, 255, 0.25);
	}

	&__header-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16px;
	}

	&__back {
		font-size: 13px;
		color: rgba(255, 255, 255, 0.85);
		cursor: pointer;
	}

	&__badge {
		padding: 2px 8px;
		border-radius: 10px;
		background: rgba(255, 255, 255, 0.2);
		font-size: 11px;
	}

	&__child {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	&__avatar {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border-radius: 14px;
		background: rgba(255, 255, 255, 0.22);
		font-size: 20px;
		font-weight: 600;
		flex: 0 0 48px;
	}

	&__child-info {
		flex: 1;
		min-width: 0;
	}

	&__child-name {
		font-size: 18px;
		font-weight: 600;
	}

	&__child-meta {
		margin-top: 2px;
		font-size: 12px;
		color: rgba(255, 255, 255, 0.8);
	}

	&__child-select {
		width: 132px;

		:deep(.el-select__wrapper) {
			background: rgba(255, 255, 255, 0.16);
			box-shadow: none;
		}

		:deep(.el-select__placeholder),
		:deep(.el-select__selected-item) {
			color: #fff;
			font-size: 12px;
		}
	}

	&__kpis {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
		margin-top: 18px;
	}

	&__kpi {
		padding: 10px;
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.16);
		text-align: center;

		strong {
			display: block;
			font-size: 19px;
			font-weight: 700;
		}

		span {
			font-size: 11px;
			color: rgba(255, 255, 255, 0.8);
		}
	}

	&__body {
		flex: 1;
		padding: 12px 12px 24px;
	}

	&__tabs {
		:deep(.el-tabs__header) {
			margin-bottom: 12px;
		}

		:deep(.el-tabs__nav-wrap::after) {
			display: none;
		}

		:deep(.el-tabs__item) {
			font-size: 14px;
		}
	}

	&__card {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 8px 4px;
		background: var(--sc-card);
		border-radius: 14px;
		box-shadow: var(--sc-shadow-1);
	}

	&__score {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 12px;

		&-name {
			width: 60px;
			font-size: 13px;
			color: var(--sc-text-2);
		}

		&-bar {
			flex: 1;
			height: 8px;
			border-radius: 4px;
			background: var(--sc-bg-sunken);
			overflow: hidden;

			span {
				display: block;
				height: 100%;
				border-radius: 4px;
			}
		}

		&-value {
			width: 36px;
			text-align: right;
			font-size: 14px;
			font-weight: 600;
			color: var(--sc-text-1);

			&.is-fail {
				color: var(--sc-danger);
			}
		}
	}

	&__row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		padding: 12px;
		border-bottom: 1px solid var(--sc-border);

		&:last-child {
			border-bottom: none;
		}

		&-title {
			font-size: 13.5px;
			color: var(--sc-text-1);
		}

		&-sub {
			margin-top: 2px;
			font-size: 12px;
			color: var(--sc-text-3);
		}
	}

	/* —— 周报 —— */
	&__report {
		display: flex;
		flex-direction: column;
		gap: 12px;

		&-head {
			display: flex;
			align-items: center;
			justify-content: space-between;
		}

		&-week {
			font-size: 12.5px;
			color: var(--sc-text-3);
		}

		&-tag {
			padding: 2px 8px;
			border-radius: 10px;
			background: var(--sc-primary-soft);
			color: var(--sc-primary);
			font-size: 11px;
		}

		&-summary {
			padding: 14px;
			border-radius: 14px;
			background: var(--sc-surface-soft);
			border: 1px solid var(--sc-surface-soft-border);
			font-size: 13px;
			line-height: 1.9;
			color: var(--sc-text-1);
		}

		&-metrics {
			display: grid;
			grid-template-columns: repeat(2, 1fr);
			gap: 8px;
		}

		&-metric {
			padding: 12px;
			border-radius: 12px;
			background: var(--sc-card);
			box-shadow: var(--sc-shadow-1);
			text-align: center;

			strong {
				display: block;
				font-size: 20px;
				font-weight: 700;
				color: var(--sc-text-1);
				font-variant-numeric: tabular-nums;

				em {
					margin-left: 2px;
					font-size: 11px;
					font-style: normal;
					font-weight: 400;
					color: var(--sc-text-3);
				}
			}

			span {
				font-size: 11.5px;
				color: var(--sc-text-3);
			}
		}

		&-block {
			padding: 14px;
			border-radius: 14px;
			background: var(--sc-card);
			box-shadow: var(--sc-shadow-1);

			&-title {
				margin-bottom: 10px;
				font-size: 13.5px;
				font-weight: 600;
				color: var(--sc-text-1);
			}
		}

		&-item {
			display: flex;
			gap: 8px;
			padding: 8px 0;
			border-bottom: 1px dashed var(--sc-border);

			&:last-child {
				border-bottom: none;
			}

			&-title {
				font-size: 12.5px;
				font-weight: 500;
				color: var(--sc-text-1);
			}

			&-text {
				margin-top: 2px;
				font-size: 12px;
				line-height: 1.7;
				color: var(--sc-text-3);
			}

			&.is-good .parent__report-dot {
				background: var(--sc-success);
			}

			&.is-warn .parent__report-dot {
				background: var(--sc-warning);
			}

			&.is-info .parent__report-dot {
				background: var(--sc-primary);
			}
		}

		&-dot {
			width: 7px;
			height: 7px;
			margin-top: 6px;
			border-radius: 50%;
			background: var(--sc-primary);
			flex: 0 0 7px;
		}

		&-advice {
			display: flex;
			flex-direction: column;
			gap: 8px;

			li {
				position: relative;
				padding-left: 16px;
				font-size: 12.5px;
				line-height: 1.8;
				color: var(--sc-text-2);

				&::before {
					content: "";
					position: absolute;
					left: 2px;
					top: 8px;
					width: 5px;
					height: 5px;
					border-radius: 50%;
					background: var(--sc-primary);
				}
			}
		}
	}
}
</style>
