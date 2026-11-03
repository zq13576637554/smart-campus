<!-- 报表中心 -->
<template>
	<div class="report-page">
		<!-- 报表目录 -->
		<aside class="report-page__aside">
			<div class="report-page__aside-head">报表目录</div>
			<div class="report-page__list">
				<div
					v-for="r in reports"
					:key="r.type"
					class="report-page__item"
					:class="{ 'is-active': r.type === current.type }"
					@click="selectReport(r)"
				>
					<div class="report-page__item-icon"><NIcon :name="r.icon" :size="16" /></div>
					<div class="report-page__item-main">
						<div class="report-page__item-title">{{ r.name }}</div>
						<div class="report-page__item-desc">{{ r.desc }}</div>
					</div>
				</div>
			</div>
		</aside>

		<!-- 查询与结果 -->
		<section class="report-page__main">
			<div class="report-page__head">
				<div>
					<div class="report-page__title">{{ current.name }}</div>
					<div class="report-page__desc">{{ current.desc }}</div>
				</div>
				<div class="report-page__actions">
					<ElButton :loading="loading" @click="run">运行报表</ElButton>
					<ElButton :loading="insightLoading" :disabled="!rows.length" @click="openInsight">
						<ElIcon><MagicStick /></ElIcon>
						AI 解读
					</ElButton>
					<ElButton type="primary" :disabled="!rows.length" @click="exportData">导出 CSV</ElButton>
				</div>
			</div>

			<div class="report-page__params">
				<div class="report-page__param">
					<span>统计范围</span>
					<ElSelect v-model="params.grade" style="width: 140px" @change="run">
						<ElOption label="全部年级" value="" />
						<ElOption v-for="g in grades" :key="g" :label="g" :value="g" />
					</ElSelect>
				</div>
				<div class="report-page__param">
					<span>统计周期</span>
					<ElDatePicker
						v-model="params.range"
						type="daterange"
						value-format="YYYY-MM-DD"
						start-placeholder="开始日期"
						end-placeholder="结束日期"
						style="width: 260px"
					/>
				</div>
				<div class="report-page__hint">共 {{ total }} 条记录 · 生成时间 {{ generatedAt }}</div>
			</div>

			<!-- 大数据集走虚拟滚动，避免一次渲染上千行 -->
			<div v-if="rows.length > 100" class="report-page__virtual">
				<div class="report-page__vhead">
					<span v-for="col in columns" :key="col.prop">{{ col.label }}</span>
				</div>
				<NVirtualList :items="rows" :item-height="40">
					<template #default="{ item, index }">
						<span class="report-page__vcell is-index">{{ index + 1 }}</span>
						<span v-for="col in columns" :key="col.prop" class="report-page__vcell">{{ item[col.prop] }}</span>
					</template>
				</NVirtualList>
			</div>

			<ElTable v-else v-loading="loading" :data="rows" height="100%" class="report-page__table" stripe>
				<ElTableColumn v-for="col in columns" :key="col.prop" :label="col.label" :prop="col.prop" min-width="120" />
				<template #empty>
					<Empty :text="loading ? '正在生成报表…' : '点击「运行报表」生成数据'" :padding="40" />
				</template>
			</ElTable>
		</section>

		<!-- AI 解读 -->
		<ElDrawer v-model="insightVisible" :title="`AI 解读 · ${current.name}`" size="480px" append-to-body>
			<div v-if="insight" class="report-insight" v-loading="insightLoading">
				<div class="report-insight__summary">{{ insight.summary }}</div>

				<div class="report-insight__metrics">
					<div v-for="m in insight.metrics" :key="m.label" class="report-insight__metric">
						<strong>{{ m.value }}<em>{{ m.unit }}</em></strong>
						<span>{{ m.label }}</span>
					</div>
				</div>

				<div class="report-insight__block">
					<div class="report-insight__block-title">关键发现</div>
					<div v-for="(f, i) in insight.findings" :key="i" class="report-insight__finding" :class="`is-${f.level}`">
						<span class="report-insight__dot"></span>
						<span>{{ f.text }}</span>
					</div>
				</div>

				<div class="report-insight__block">
					<div class="report-insight__block-title">行动建议</div>
					<ol class="report-insight__suggestions">
						<li v-for="(s, i) in insight.suggestions" :key="i">{{ s }}</li>
					</ol>
				</div>

				<div class="report-insight__tip">解读由规则引擎生成，仅供参考；接入大模型后可获得更细的归因分析。</div>
			</div>
		</ElDrawer>
	</div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElButton, ElDatePicker, ElDrawer, ElIcon, ElMessage, ElOption, ElSelect, ElTable, ElTableColumn } from "lmLibs/element-plus";
import { MagicStick } from "@element-plus/icons-vue";
import NIcon from "lmCmpsBasic/NIcon";
import Empty from "lmCmpsBasic/Empty";
import NVirtualList from "lmCmpsBasic/NVirtualList";
import { $reportRunPost } from "lmApisCampus/api/report";
import { $aiReportInsightPost } from "lmApisCampus/api/ai";
import { sync } from "lmUtils/promise";
import { exportCsv } from "lmUtils/download";
import { dayjs } from "lmUtils/time";

interface ReportDef {
	type: string;
	name: string;
	desc: string;
	icon: string;
}

const reports: ReportDef[] = [
	{ type: "roster", name: "学生花名册", desc: "按年级导出在册学生基础信息", icon: "student" },
	{ type: "attendance", name: "考勤汇总", desc: "按班级统计出勤、迟到、缺勤", icon: "attendance" },
	{ type: "score", name: "成绩汇总", desc: "按学科统计均分、最高最低与及格率", icon: "score" },
	{ type: "bill", name: "缴费汇总", desc: "按班级统计应收、已收与欠费", icon: "card" }
];

const grades = ["高一", "高二", "高三"];
const current = ref<ReportDef>(reports[0]);
const params = reactive<Record<string, any>>({ grade: "", range: [] });
const columns = ref<any[]>([]);
const rows = ref<any[]>([]);
const total = ref(0);
const loading = ref(false);
const generatedAt = ref("--");

/* AI 解读 */
const insightVisible = ref(false);
const insightLoading = ref(false);
const insight = ref<any>(null);

const openInsight = async () => {
	insightVisible.value = true;
	if (insight.value) return;
	insightLoading.value = true;
	try {
		const [err, res] = await sync($aiReportInsightPost({ reportType: current.value.type, rows: rows.value }));
		if (!err) insight.value = res;
	} finally {
		insightLoading.value = false;
	}
};

const selectReport = (r: ReportDef) => {
	current.value = r;
	columns.value = [];
	rows.value = [];
	total.value = 0;
	insight.value = null;
	run();
};

const run = async () => {
	loading.value = true;
	try {
		const [err, res] = await sync(
			$reportRunPost({ type: current.value.type, grade: params.grade, startDate: params.range?.[0], endDate: params.range?.[1] })
		);
		if (err) return;
		columns.value = (res as any).columns || [];
		rows.value = (res as any).rows || [];
		total.value = (res as any).total || 0;
		generatedAt.value = dayjs().format("YYYY-MM-DD HH:mm:ss");
	} finally {
		loading.value = false;
	}
};

const exportData = () => {
	exportCsv(rows.value, columns.value.map((c: any) => ({ label: c.label, prop: c.prop })), current.value.name);
	ElMessage.success(`已导出「${current.value.name}」${rows.value.length} 条`);
};

onMounted(run);
</script>

<style lang="less">
.report-page {
	display: flex;
	gap: 12px;
	height: 100%;
	min-height: 0;

	&__aside {
		flex: 0 0 260px;
		display: flex;
		flex-direction: column;
		background: var(--sc-card);
		border-radius: var(--sc-radius-lg);
		box-shadow: var(--sc-shadow-1);
		overflow: hidden;

		&-head {
			padding: 14px 16px;
			border-bottom: 1px solid var(--sc-border);
			font-size: 14px;
			font-weight: 600;
		}
	}

	&__list {
		flex: 1;
		overflow: auto;
		padding: 8px;
	}

	&__item {
		display: flex;
		gap: 10px;
		padding: 10px;
		border-radius: var(--sc-radius-sm);
		cursor: pointer;
		transition: background 0.15s;

		&:hover {
			background: var(--sc-bg-sunken);
		}

		&.is-active {
			background: var(--sc-primary-soft);
		}

		&-icon {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 30px;
			height: 30px;
			border-radius: 8px;
			background: var(--sc-card);
			color: var(--sc-primary);
			border: 1px solid var(--sc-border);
			flex: 0 0 30px;
		}

		&-title {
			font-size: 13px;
			color: var(--sc-text-1);
		}

		&-desc {
			margin-top: 2px;
			font-size: 11.5px;
			line-height: 1.5;
			color: var(--sc-text-3);
		}
	}

	&__main {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
		background: var(--sc-card);
		border-radius: var(--sc-radius-lg);
		box-shadow: var(--sc-shadow-1);
		padding: 16px;
	}

	&__head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
	}

	&__title {
		font-size: 16px;
		font-weight: 600;
		color: var(--sc-text-1);
	}

	&__desc {
		margin-top: 3px;
		font-size: 12.5px;
		color: var(--sc-text-3);
	}

	&__actions {
		display: flex;
		gap: 8px;
	}

	&__params {
		display: flex;
		align-items: center;
		gap: 20px;
		flex-wrap: wrap;
		margin: 14px 0 12px;
		padding: 12px 14px;
		border-radius: var(--sc-radius);
		background: var(--sc-bg);
	}

	&__param {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		color: var(--sc-text-2);
	}

	&__hint {
		margin-left: auto;
		font-size: 12px;
		color: var(--sc-text-3);
	}

	&__table {
		flex: 1;
		min-height: 0;
	}

	&__virtual {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		border: 1px solid var(--sc-border);
		border-radius: var(--sc-radius);
		overflow: hidden;
	}

	&__vhead {
		display: flex;
		padding: 0 12px;
		height: 42px;
		background: var(--sc-bg-sunken);
		border-bottom: 1px solid var(--sc-border);
		font-size: 13px;
		font-weight: 500;
		color: var(--sc-text-2);

		span {
			flex: 1;
			display: flex;
			align-items: center;
			min-width: 0;
		}

		span:first-child {
			flex: 0 0 56px;
		}
	}

	&__vcell {
		flex: 1;
		min-width: 0;
		padding: 0 6px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;

		&.is-index {
			flex: 0 0 56px;
			color: var(--sc-text-3);
		}
	}

	/* ---------------- 移动端：目录改横向滚动，主体纵向堆叠 ---------------- */
	@media (max-width: 768px) {
		flex-direction: column;

		&__aside {
			flex: 0 0 auto;
		}

		&__aside-head {
			padding: 10px 12px;
			font-size: 13px;
		}

		&__list {
			display: flex;
			gap: 8px;
			overflow-x: auto;
			padding: 8px;
		}

		&__item {
			flex: 0 0 auto;
			min-width: 190px;
			max-width: 220px;
			padding: 8px;
		}

		&__main {
			padding: 12px;
		}

		&__head {
			flex-direction: column;
			align-items: stretch;
			gap: 10px;
		}

		&__actions {
			flex-wrap: wrap;
		}

		&__params {
			flex-direction: column;
			align-items: stretch;
			gap: 10px;
			margin: 12px 0;
		}

		&__hint {
			margin-left: 0;
		}

		&__virtual,
		&__table {
			min-height: 340px;
		}
	}
}

/* —— AI 解读抽屉 —— */
.report-insight {
	display: flex;
	flex-direction: column;
	gap: 16px;

	&__summary {
		padding: 14px;
		border-radius: var(--sc-radius);
		background: var(--sc-surface-soft);
		border: 1px solid var(--sc-surface-soft-border);
		font-size: 13px;
		line-height: 1.9;
		color: var(--sc-text-1);
	}

	&__metrics {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 10px;
	}

	&__metric {
		padding: 12px;
		border: 1px solid var(--sc-border);
		border-radius: var(--sc-radius);
		background: var(--sc-card);
		text-align: center;

		strong {
			display: block;
			font-size: 19px;
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

	&__block-title {
		margin-bottom: 8px;
		font-size: 13.5px;
		font-weight: 600;
		color: var(--sc-text-1);
	}

	&__finding {
		display: flex;
		gap: 8px;
		padding: 8px 0;
		border-bottom: 1px dashed var(--sc-border);
		font-size: 12.5px;
		line-height: 1.8;
		color: var(--sc-text-2);

		&:last-child {
			border-bottom: none;
		}

		&.is-good .report-insight__dot {
			background: var(--sc-success);
		}

		&.is-warn .report-insight__dot {
			background: var(--sc-warning);
		}

		&.is-danger .report-insight__dot {
			background: var(--sc-danger);
		}
	}

	&__dot {
		width: 6px;
		height: 6px;
		margin-top: 8px;
		border-radius: 50%;
		background: var(--sc-primary);
		flex: 0 0 6px;
	}

	&__suggestions {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding-left: 18px;
		list-style: decimal;

		li {
			font-size: 12.5px;
			line-height: 1.8;
			color: var(--sc-text-2);
		}
	}

	&__tip {
		padding-top: 12px;
		border-top: 1px solid var(--sc-border);
		font-size: 11.5px;
		line-height: 1.7;
		color: var(--sc-text-4);
	}
}
</style>
