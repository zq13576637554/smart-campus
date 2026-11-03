<!-- 智能考勤 -->
<template>
	<div class="page-container attendance-page">
		<!-- 指标卡 -->
		<div class="attendance-page__stats">
			<div v-for="item in statCards" :key="item.label" class="attendance-page__stat" :class="`is-${item.type}`">
				<div class="attendance-page__stat-icon">
					<NIcon :name="item.icon" :size="20" />
				</div>
				<div>
					<div class="attendance-page__stat-label">{{ item.label }}</div>
					<div class="attendance-page__stat-value">{{ item.value }}<em>{{ item.unit }}</em></div>
				</div>
			</div>
		</div>

		<!-- 图表 -->
		<ElRow :gutter="12">
			<ElCol :xs="24" :lg="14">
				<NCard title="近 7 天出勤趋势" class="attendance-page__chart">
					<Echart :option="trendOption" :height="200" />
				</NCard>
			</ElCol>
			<ElCol :xs="12" :lg="5">
				<NCard title="考勤类型分布" class="attendance-page__chart">
					<Echart :option="typeOption" :height="200" />
				</NCard>
			</ElCol>
			<ElCol :xs="12" :lg="5">
				<NCard title="打卡方式" class="attendance-page__chart">
					<Echart :option="methodOption" :height="200" />
				</NCard>
			</ElCol>
		</ElRow>

		<!-- 明细 -->
		<div class="attendance-page__list">
			<NPageBasic
				ref="pageRef"
				title="考勤明细"
				row-key="id"
				:bars="_bars"
				:cols="_cols"
				:api="fetchData"
				:is-show-more-filter="true"
				:fixed-show-item-len="3"
				:tb-props="{ maxHeight: '100%' }"
				@on-tb-event-watch="onTbAction"
			>
				<template #handle-buttons>
					<ElButton type="primary" @click="openFix()">补录考勤</ElButton>
				</template>
			</NPageBasic>
		</div>

		<!-- 补录弹窗 -->
		<Dialog v-model="fixVisible" title="补录考勤" :loading="submitting" width="560px" @ok="onSubmitFix">
			<Form ref="formRef" :items="fixItems" :form-data="fixData" :show-footer="false" label-width="90px" />
		</Dialog>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElButton, ElCol, ElMessage, ElRow } from "lmLibs/element-plus";
import NPageBasic from "lmCmpsBiz/NPageBasic";
import NCard from "lmCmpsBasic/NCard";
import NIcon from "lmCmpsBasic/NIcon";
import Dialog from "lmCmpsBasic/Dialog";
import Form from "lmCmpsBasic/Form";
import Echart from "lmCmpsEcharts/Echart";
import type { FormItem } from "lmCmpsBasic/Form/types";
import { Input, Select, Date } from "lmIreposF";
import { useSimpleCols } from "lmHooks/tools/useCols";
import { useSimpleBars } from "lmHooks/tools/useBars";
import { $attendancePagePost, $attendanceSavePost, $attendanceStatisticsGet, $classOptionsGet } from "lmApisCampus/api/academic";
import { sync } from "lmUtils/promise";
import { dayjs } from "lmUtils/time";

const pageRef = ref();
const formRef = ref();
const stats = ref<Record<string, any>>({});
const classOptions = ref<any[]>([]);
const fixVisible = ref(false);
const submitting = ref(false);

const statCards = computed(() => {
	const byType = stats.value.byType || [];
	const findType = (t: string) => byType.find((x: any) => x.name === t)?.value || 0;
	return [
		{ label: "考勤记录", value: stats.value.total || 0, unit: "条", type: "primary", icon: "attendance" },
		{ label: "正常率", value: stats.value.normalRate || 0, unit: "%", type: "success", icon: "score" },
		{ label: "迟到", value: findType("迟到"), unit: "人次", type: "warning", icon: "schedule" },
		{ label: "缺勤", value: findType("缺勤"), unit: "人次", type: "danger", icon: "notice" }
	];
});

const _bars = computed(() =>
	useSimpleBars([
		"姓名|name|input",
		"学号|studentNo|input",
		{
			bar: "班级|className|select",
			config: { props: { options: classOptions.value.map(c => ({ label: c.label, value: c.label })) } }
		},
		{
			bar: "考勤类型|type|enum-type:ATTENDANCE_TYPE",
			config: { itemValue: "" }
		},
		{
			bar: "打卡方式|method|enum-type:CHECK_METHOD",
			config: { itemValue: "" }
		},
		{
			bar: "日期|date|date-type:daterange-startKey:startDate-endKey:endDate",
			config: { props: { format: "YYYY/MM/DD", valueFormat: "YYYY-MM-DD" } }
		}
	])
);

const _cols = computed(() =>
	useSimpleCols([
		"idx",
		"姓名|name|text|minWidth:100",
		"学号|studentNo|minWidth:120",
		"班级|className|minWidth:110",
		"日期|date|minWidth:110",
		{
			col: "考勤类型|type|tag|minWidth:100",
			setComProps: { dictType: "ATTENDANCE_TYPE" }
		},
		"打卡时间|time|text|minWidth:100",
		{
			col: "打卡方式|method|tag|minWidth:110",
			setComProps: { dictType: "CHECK_METHOD" }
		},
		"打卡设备|device|minWidth:140",
		"备注|remark|minWidth:140",
		{ col: "actions|补录:fix", setComProps: { fixed: "right", minWidth: 100 } }
	])
);

const fetchData = (params: Record<string, any>) => $attendancePagePost(params);

/* ---------------- 图表 ---------------- */
const trendOption = computed(() => {
	const trend = stats.value.trend || [];
	return {
		grid: { left: 40, right: 16, top: 24, bottom: 26 },
		tooltip: { trigger: "axis" },
		xAxis: { type: "category", data: trend.map((t: any) => t.date), axisLabel: { color: "#86909c" }, axisLine: { lineStyle: { color: "#e5e6eb" } } },
		yAxis: { type: "value", min: 80, max: 100, axisLabel: { color: "#86909c", formatter: "{value}%" }, splitLine: { lineStyle: { color: "#f2f3f5" } } },
		series: [
			{
				type: "line",
				smooth: true,
				data: trend.map((t: any) => t.rate),
				symbolSize: 6,
				itemStyle: { color: "#00B42A" },
				areaStyle: {
					color: {
						type: "linear",
						x: 0,
						y: 0,
						x2: 0,
						y2: 1,
						colorStops: [
							{ offset: 0, color: "rgba(0,180,42,0.25)" },
							{ offset: 1, color: "rgba(0,180,42,0.02)" }
						]
					}
				}
			}
		]
	};
});

const typeOption = computed(() => {
	const list = stats.value.byType || [];
	const colors: Record<string, string> = { 正常: "#00B42A", 迟到: "#FF7D00", 早退: "#F7BA1E", 缺勤: "#F53F3F", 请假: "#86909C" };
	return {
		tooltip: { trigger: "item" },
		legend: { bottom: 0, itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 11 } },
		series: [
			{
				type: "pie",
				radius: ["48%", "72%"],
				center: ["50%", "42%"],
				label: { show: false },
				itemStyle: { borderColor: "#fff", borderWidth: 2 },
				data: list.map((d: any) => ({ name: d.name, value: d.value, itemStyle: { color: colors[d.name] || "#165DFF" } }))
			}
		]
	};
});

const methodOption = computed(() => {
	const list = stats.value.byMethod || [];
	return {
		grid: { left: 70, right: 24, top: 10, bottom: 30 },
		tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
		xAxis: { type: "value", splitLine: { lineStyle: { color: "#f2f3f5" } }, axisLabel: { color: "#86909c" } },
		yAxis: { type: "category", data: list.map((d: any) => d.name), axisLabel: { color: "#4e5969" }, axisLine: { lineStyle: { color: "#e5e6eb" } } },
		series: [{ type: "bar", barWidth: 12, data: list.map((d: any) => d.value), itemStyle: { color: "#165DFF", borderRadius: [0, 6, 6, 0] } }]
	};
});

/* ---------------- 补录 ---------------- */
const fixData = reactive<Record<string, any>>({
	id: "",
	name: "",
	studentNo: "",
	className: "",
	date: dayjs().format("YYYY-MM-DD"),
	time: "08:00:00",
	type: "NORMAL",
	method: "MANUAL",
	device: "手动登记",
	remark: "管理员补录"
});

const fixItems = computed<FormItem[]>(() => [
	Input({ label: "学生姓名", prop: "name", yours: { placeholder: "请输入学生姓名" } }),
	Input({ label: "学号", prop: "studentNo", yours: { placeholder: "请输入学号" } }),
	Select({
		label: "班级",
		prop: "className",
		yours: { options: classOptions.value.map(c => ({ label: c.label, value: c.label })) }
	}),
	Date({ label: "日期", prop: "date", yours: { placeholder: "请选择日期", style: "width:100%" } }),
	Select({
		label: "考勤类型",
		prop: "type",
		type: "enumSelect",
		dictType: "ATTENDANCE_TYPE"
	}),
	Select({
		label: "打卡方式",
		prop: "method",
		type: "enumSelect",
		dictType: "CHECK_METHOD"
	}),
	Input({ label: "备注", prop: "remark", colProps: { span: 24 }, yours: { placeholder: "补录原因", type: "textarea", rows: 2 } })
]);

const openFix = (row?: any) => {
	Object.assign(fixData, {
		id: row?.id || "",
		name: row?.name || "",
		studentNo: row?.studentNo || "",
		className: row?.className || "",
		date: row?.date || dayjs().format("YYYY-MM-DD"),
		time: row?.time || "08:00:00",
		type: row?.type || "NORMAL",
		method: row?.method || "MANUAL",
		device: row?.device || "手动登记",
		remark: row?.remark || "管理员补录"
	});
	fixVisible.value = true;
};

const onSubmitFix = async () => {
	const valid = await formRef.value?.__validForm?.();
	if (!valid) return;
	submitting.value = true;
	try {
		const [err] = await sync($attendanceSavePost({ ...fixData }));
		if (err) return;
		ElMessage.success("补录成功");
		fixVisible.value = false;
		pageRef.value.doSearch(true, "search");
		loadStats();
	} finally {
		submitting.value = false;
	}
};

const onTbAction = ({ key, data }: any) => {
	if (key === "fix") openFix(data?.data?.row);
};

const loadStats = async () => {
	const [err, res] = await sync($attendanceStatisticsGet());
	if (!err) stats.value = (res as any) || {};
};

onMounted(async () => {
	const [err, res] = await sync($classOptionsGet());
	if (!err) classOptions.value = res as any;
	await loadStats();
});
</script>

<style lang="less">
.attendance-page {
	&__stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 12px;
	}

	&__stat {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px;
		background: var(--sc-card);
		border-radius: 8px;

		&-icon {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 40px;
			height: 40px;
			border-radius: 10px;
			color: #165dff;
			background: #e8f3ff;
		}

		&.is-success &-icon {
			color: #00b42a;
			background: #e8ffea;
		}

		&.is-warning &-icon {
			color: #ff7d00;
			background: var(--sc-warning-soft);
		}

		&.is-danger &-icon {
			color: #f53f3f;
			background: #ffece8;
		}

		&-label {
			font-size: 12px;
			color: #86909c;
		}

		&-value {
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

	&__chart {
		height: 100%;
	}

	&__list {
		flex: 1;
		min-height: 0;
		display: flex;
	}
}
</style>
