<!-- 学业成绩 -->
<template>
	<div class="page-container score-page">
		<ElRow :gutter="12">
			<ElCol :xs="24" :lg="14">
				<NCard title="各学科平均分与及格率" class="score-page__card">
					<Echart :option="courseOption" :height="240" />
				</NCard>
			</ElCol>
			<ElCol :xs="24" :lg="10">
				<NCard title="成绩等级分布" class="score-page__card">
					<Echart :option="levelOption" :height="240" />
				</NCard>
			</ElCol>
		</ElRow>

		<ElRow :gutter="12">
			<ElCol :xs="24" :lg="14">
				<div class="score-page__list">
					<NPageBasic
						ref="pageRef"
						title="成绩明细"
						row-key="id"
						:bars="_bars"
						:cols="_cols"
						:api="fetchData"
						:bar-columns="3"
						:is-show-more-filter="true"
						@on-tb-event-watch="onTbAction"
					>
						<template #handle-buttons>
							<ElButton type="primary" @click="openEdit()">录入成绩</ElButton>
						</template>
					</NPageBasic>
				</div>
			</ElCol>
			<ElCol :xs="24" :lg="10">
				<NCard title="年级前十名" class="score-page__card score-page__rank">
					<div v-for="(stu, index) in analysis.topStudents || []" :key="stu.studentNo" class="score-page__rank-item">
						<span class="score-page__rank-no" :class="`is-${index + 1}`">{{ index + 1 }}</span>
						<div class="score-page__rank-main">
							<div class="score-page__rank-name">{{ stu.name }}</div>
							<div class="score-page__rank-class">{{ stu.className }}</div>
						</div>
						<span class="score-page__rank-score">{{ stu.avg }}</span>
					</div>
					<Empty v-if="!analysis.topStudents?.length" text="暂无成绩数据" :padding="30" />
				</NCard>
			</ElCol>
		</ElRow>

		<Dialog v-model="editVisible" title="录入成绩" :loading="submitting" width="520px" @ok="onSubmit">
			<Form ref="formRef" :items="editItems" :form-data="editData" :show-footer="false" label-width="90px" />
		</Dialog>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElButton, ElCol, ElMessage, ElRow } from "lmLibs/element-plus";
import NPageBasic from "lmCmpsBiz/NPageBasic";
import NCard from "lmCmpsBasic/NCard";
import Dialog from "lmCmpsBasic/Dialog";
import Form from "lmCmpsBasic/Form";
import Empty from "lmCmpsBasic/Empty";
import Echart from "lmCmpsEcharts/Echart";
import type { FormItem } from "lmCmpsBasic/Form/types";
import { Input, Select, Input as NumberInput } from "lmIreposF";
import { useSimpleCols } from "lmHooks/tools/useCols";
import { useSimpleBars } from "lmHooks/tools/useBars";
import { $classOptionsGet, $scoreAnalysisGet, $scorePagePost, $scoreSavePost } from "lmApisCampus/api/academic";
import { sync } from "lmUtils/promise";

const pageRef = ref();
const formRef = ref();
const analysis = ref<Record<string, any>>({});
const classOptions = ref<any[]>([]);
const editVisible = ref(false);
const submitting = ref(false);

const _bars = computed(() =>
	useSimpleBars([
		"姓名|name|input",
		"学号|studentNo|input",
		{
			bar: "班级|className|select",
			config: { props: { options: classOptions.value.map(c => ({ label: c.label, value: c.label })) } }
		},
		{
			bar: "学科|courseName|select",
			config: {
				props: {
					options: ["语文", "数学", "英语", "物理", "化学"].map(s => ({ label: s, value: s }))
				}
			}
		},
		{
			bar: "等级|level|enum-type:SCORE_LEVEL",
			config: { itemValue: "" }
		}
	])
);

const _cols = computed(() =>
	useSimpleCols([
		"idx",
		"姓名|name|text|minWidth:100",
		"学号|studentNo|minWidth:120",
		"班级|className|minWidth:110",
		"学科|courseName|minWidth:90",
		{
			col: "分数|score|text|minWidth:90",
			tdFn: (h: any, ctx: any) => {
				const { row } = ctx.data;
				const color = row.score >= 90 ? "#00B42A" : row.score >= 60 ? "#165DFF" : "#F53F3F";
				return h("span", { style: { color, fontWeight: 600 } }, String(row.score));
			}
		},
		"班级排名|classRank|text|minWidth:100",
		{
			col: "等级|level|tag|minWidth:100",
			setComProps: { dictType: "SCORE_LEVEL" }
		},
		{
			col: "actions|录入:edit",
			setComProps: { fixed: "right", minWidth: 100 }
		}
	])
);

const fetchData = (params: Record<string, any>) => $scorePagePost(params);

/* ---------------- 图表 ---------------- */
const courseOption = computed(() => {
	const list = analysis.value.byCourse || [];
	return {
		grid: { left: 44, right: 44, top: 34, bottom: 28 },
		tooltip: { trigger: "axis" },
		legend: { right: 0, top: 0, itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11 } },
		xAxis: { type: "category", data: list.map((d: any) => d.name), axisLabel: { color: "#4e5969" }, axisLine: { lineStyle: { color: "#e5e6eb" } } },
		yAxis: [
			{ type: "value", min: 0, max: 100, axisLabel: { color: "#86909c" }, splitLine: { lineStyle: { color: "#f2f3f5" } } },
			{ type: "value", min: 0, max: 100, axisLabel: { color: "#86909c", formatter: "{value}%" }, splitLine: { show: false } }
		],
		series: [
			{
				name: "平均分",
				type: "bar",
				barWidth: 22,
				data: list.map((d: any) => d.avg),
				itemStyle: { color: "#165DFF", borderRadius: [6, 6, 0, 0] }
			},
			{ name: "及格率", type: "line", yAxisIndex: 1, smooth: true, data: list.map((d: any) => d.passRate), itemStyle: { color: "#FF7D00" } }
		]
	};
});

const levelOption = computed(() => {
	const colors: Record<string, string> = { 优秀: "#00B42A", 良好: "#165DFF", 及格: "#FF7D00", 不及格: "#F53F3F" };
	const list = analysis.value.byLevel || [];
	return {
		tooltip: { trigger: "item", formatter: "{b}: {c} 人 ({d}%)" },
		legend: { bottom: 0, itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 11 } },
		series: [
			{
				type: "pie",
				radius: ["45%", "70%"],
				center: ["50%", "44%"],
				label: { show: false },
				itemStyle: { borderColor: "#fff", borderWidth: 3 },
				data: list.map((d: any) => ({ name: d.name, value: d.value, itemStyle: { color: colors[d.name] || "#165DFF" } }))
			}
		]
	};
});

/* ---------------- 成绩录入 ---------------- */
const editData = reactive<Record<string, any>>({
	id: "",
	name: "",
	studentNo: "",
	className: "",
	courseName: "",
	score: 0
});

const editItems = computed<FormItem[]>(() => [
	Input({ label: "姓名", prop: "name", yours: { disabled: true } }),
	Input({ label: "学号", prop: "studentNo", yours: { disabled: true } }),
	Input({ label: "班级", prop: "className", yours: { disabled: true } }),
	Input({ label: "学科", prop: "courseName", yours: { disabled: true } }),
	Input({
		label: "分数",
		prop: "score",
		colProps: { span: 24 },
		rules: [{ required: true, message: "请输入分数", trigger: "blur" }],
		yours: { placeholder: "请输入 0-100 的分数", type: "number", min: 0, max: 100 }
	})
]);

const openEdit = (row?: any) => {
	Object.assign(editData, {
		id: row?.id || "",
		name: row?.name || "",
		studentNo: row?.studentNo || "",
		className: row?.className || "",
		courseName: row?.courseName || "",
		score: row?.score ?? 0
	});
	editVisible.value = true;
};

const onSubmit = async () => {
	const valid = await formRef.value?.__validForm?.();
	if (!valid) return;
	submitting.value = true;
	try {
		const [err] = await sync($scoreSavePost({ ...editData }));
		if (err) return;
		ElMessage.success("录入成功");
		editVisible.value = false;
		pageRef.value.doSearch(true, "search");
		loadAnalysis();
	} finally {
		submitting.value = false;
	}
};

const onTbAction = ({ key, data }: any) => {
	if (key === "edit") openEdit(data?.data?.row);
};

const loadAnalysis = async () => {
	const [err, res] = await sync($scoreAnalysisGet());
	if (!err) analysis.value = (res as any) || {};
};

onMounted(async () => {
	const [err, res] = await sync($classOptionsGet());
	if (!err) classOptions.value = res as any;
	await loadAnalysis();
});
</script>

<style lang="less">
.score-page {
	overflow: auto;

	&__card {
		height: 100%;
	}

	&__list {
		height: 480px;
		display: flex;
	}

	&__rank {
		max-height: 480px;
		overflow: auto;
	}

	&__rank-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 7px 0;
		border-bottom: 1px dashed #f2f3f5;

		&:last-child {
			border-bottom: none;
		}
	}

	&__rank-no {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		border-radius: 5px;
		background: #f2f3f5;
		color: #86909c;
		font-size: 11px;

		&.is-1 {
			background: #ffe8b3;
			color: #b87400;
		}

		&.is-2 {
			background: #e8eaed;
			color: #6b7280;
		}

		&.is-3 {
			background: #ffe0cc;
			color: #b25900;
		}
	}

	&__rank-main {
		flex: 1;
	}

	&__rank-name {
		font-size: 13px;
		color: #1d2129;
	}

	&__rank-class {
		font-size: 11px;
		color: #86909c;
	}

	&__rank-score {
		font-size: 15px;
		font-weight: 600;
		color: #165dff;
	}
}
</style>
