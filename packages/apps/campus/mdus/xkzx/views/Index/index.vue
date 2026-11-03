<!-- 选课中心 -->
<template>
	<div class="page-container enroll-page">
		<div class="enroll-page__stats">
			<div v-for="item in statCards" :key="item.label" class="enroll-page__stat">
				<div class="enroll-page__stat-label">{{ item.label }}</div>
				<div class="enroll-page__stat-value">{{ item.value }}<em>{{ item.unit }}</em></div>
			</div>
			<NCard title="热门课程满员率" class="enroll-page__hot">
				<div class="enroll-page__hot-list">
					<div v-for="h in stats.hot || []" :key="h.name" class="enroll-page__hot-item">
						<span class="enroll-page__hot-name">{{ h.name }}</span>
						<div class="enroll-page__hot-bar">
							<span :style="{ width: `${h.value}%` }"></span>
						</div>
						<span class="enroll-page__hot-value">{{ h.value }}%</span>
					</div>
				</div>
			</NCard>
		</div>

		<div class="enroll-page__list">
			<NPageBasic
				ref="pageRef"
				title="课程选课"
				row-key="id"
				:bars="bars"
				:cols="cols"
				:api="fetchData"
				@on-tb-event-watch="onTbAction"
			/>
		</div>

		<Dialog v-model="studentsVisible" :title="`选课名单 · ${currentCourse}`" width="720px" :show-footer="true" ok-text="关闭" @ok="studentsVisible = false">
			<div class="enroll-page__students-head">
				<span>已选 <strong>{{ students.length }}</strong> 人</span>
				<ElButton size="small" plain @click="exportStudents">导出名单</ElButton>
			</div>
			<ElTable :data="students" height="380" stripe>
				<ElTableColumn type="index" label="#" width="60" />
				<ElTableColumn label="姓名" prop="studentName" min-width="110" />
				<ElTableColumn label="学号" prop="studentNo" min-width="130" />
				<ElTableColumn label="班级" prop="className" min-width="120" />
				<ElTableColumn label="选课时间" prop="time" min-width="170" />
			</ElTable>
		</Dialog>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElButton, ElMessage, ElTable, ElTableColumn } from "lmLibs/element-plus";
import NPageBasic from "lmCmpsBiz/NPageBasic";
import NCard from "lmCmpsBasic/NCard";
import Dialog from "lmCmpsBasic/Dialog";
import { useSimpleCols } from "lmHooks/tools/useCols";
import { useSimpleBars } from "lmHooks/tools/useBars";
import { $enrollPagePost, $enrollStatisticsGet, $enrollStudentsGet, $enrollTogglePost } from "lmApisCampus/api/enroll";
import { sync } from "lmUtils/promise";
import { exportCsv } from "lmUtils/download";

const pageRef = ref();
const stats = ref<Record<string, any>>({});
const studentsVisible = ref(false);
const students = ref<any[]>([]);
const currentCourse = ref("");

const statCards = computed(() => [
	{ label: "课程数", value: stats.value.courses || 0, unit: "门" },
	{ label: "开放中", value: stats.value.openCourses || 0, unit: "门" },
	{ label: "已选人次", value: stats.value.enrolled || 0, unit: "人" },
	{ label: "平均满员率", value: stats.value.rate || 0, unit: "%" }
]);

const bars = computed(() =>
	useSimpleBars([
		"课程名称|courseName|input",
		{
			bar: "年级|grade|select",
			config: { props: { options: ["高一", "高二", "高三"].map(g => ({ label: g, value: g })) } }
		},
		{
			bar: "课程类型|type|enum-type:COURSE_TYPE",
			config: { itemValue: "" }
		},
		{
			bar: "选课状态|open|select",
			config: {
				props: {
					options: [
						{ label: "开放中", value: "true" },
						{ label: "已关闭", value: "false" }
					]
				}
			}
		}
	])
);

const cols = computed(() =>
	useSimpleCols([
		"idx",
		"课程名称|courseName|text|minWidth:160",
		"授课教师|teacherName|minWidth:110",
		"年级|grade|minWidth:90",
		{
			col: "类型|type|tag|minWidth:90",
			setComProps: { dictType: "COURSE_TYPE" }
		},
		{ col: "学分|credit|text|minWidth:80", tdFn: (h: any, ctx: any) => h("span", {}, `${ctx.data.row.credit} 分`) },
		{
			col: "选课情况|enrolled|text|minWidth:130",
			tdFn: (h: any, ctx: any) => {
				const { row } = ctx.data;
				const full = row.enrolled >= row.capacity;
				return h("span", { style: { color: full ? "#F53F3F" : "#1D2129" } }, `${row.enrolled} / ${row.capacity}`);
			}
		},
		{
			col: "满员率|rate|progress|minWidth:160"
		},
		{
			col: "状态|open|tag|minWidth:100",
			setComProps: (row: any) => ({ type: row.open ? "success" : "info", text: row.open ? "开放中" : "已关闭" })
		},
		{
			col: "actions|名单:students-开放:open-关闭:close",
			setComProps: {
				fixed: "right",
				minWidth: 170,
				cmds: (row: any) =>
					row.open
						? [
								{ text: "名单", action: "students" },
								{ text: "关闭", action: "close", type: "danger" }
						  ]
						: [
								{ text: "名单", action: "students" },
								{ text: "开放", action: "open" }
						  ]
			}
		}
	])
);

/** 列表接口：附带满员率，供进度条列使用 */
const fetchData = async (params: Record<string, any>) => {
	const res = await $enrollPagePost(params);
	return {
		...res,
		content: res.content.map((c: any) => ({ ...c, rate: Math.round((c.enrolled / c.capacity) * 100) }))
	};
};

const loadStats = async () => {
	const [err, res] = await sync($enrollStatisticsGet());
	if (!err) stats.value = (res as any) || {};
};

const openStudents = async (row: any) => {
	currentCourse.value = row.courseName;
	const [err, res] = await sync($enrollStudentsGet({ courseId: row.courseId }));
	students.value = err ? [] : ((res as any) || []);
	studentsVisible.value = true;
};

const exportStudents = () => {
	exportCsv(
		students.value,
		[
			{ label: "姓名", prop: "studentName" },
			{ label: "学号", prop: "studentNo" },
			{ label: "班级", prop: "className" },
			{ label: "选课时间", prop: "time" }
		],
		`${currentCourse.value}-选课名单`
	);
	ElMessage.success("名单已导出");
};

const onTbAction = async ({ key, data }: any) => {
	const row = data?.data?.row;
	if (key === "students") return openStudents(row);
	if (key === "open" || key === "close") {
		const [err] = await sync($enrollTogglePost({ id: row.id, open: key === "open" }));
		if (!err) {
			ElMessage.success(key === "open" ? "已开放选课" : "已关闭选课");
			pageRef.value.doSearch(true, "search");
			loadStats();
		}
	}
};

onMounted(loadStats);
</script>

<style lang="less">
.enroll-page {
	&__stats {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 12px;
	}

	&__stat {
		padding: 16px 18px;
		background: var(--sc-card);
		border: 1px solid var(--sc-border);
		border-radius: var(--sc-radius-lg);
		box-shadow: var(--sc-shadow-1);

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

	&__hot {
		grid-column: 1 / -1;

		&-list {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 8px 32px;
		}

		&-item {
			display: flex;
			align-items: center;
			gap: 10px;
		}

		&-name {
			width: 120px;
			font-size: 12.5px;
			color: var(--sc-text-2);
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
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
				background: linear-gradient(90deg, var(--sc-primary), #5ce1e6);
			}
		}

		&-value {
			width: 44px;
			text-align: right;
			font-size: 12.5px;
			color: var(--sc-text-2);
			font-variant-numeric: tabular-nums;
		}
	}

	&__list {
		flex: 1;
		min-height: 380px;
		display: flex;
	}

	&__students-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 10px;
		font-size: 13px;
		color: var(--sc-text-2);

		strong {
			color: var(--sc-primary);
		}
	}
}

@media (max-width: 1400px) {
	.enroll-page__stats {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.enroll-page__hot {
		grid-column: span 2;
	}
}
</style>
