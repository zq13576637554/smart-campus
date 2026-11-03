<!-- 综合素质评价 -->
<template>
	<div class="page-container eval-page">
		<div class="eval-page__stats">
			<div v-for="item in statCards" :key="item.label" class="eval-page__stat">
				<div class="eval-page__stat-label">{{ item.label }}</div>
				<div class="eval-page__stat-value">{{ item.value }}<em>{{ item.unit }}</em></div>
			</div>
			<NCard title="评价等级分布" class="eval-page__levels">
				<div v-for="l in stats.levels || []" :key="l.name" class="eval-page__level">
					<span class="eval-page__level-name">{{ l.name }} 级</span>
					<div class="eval-page__level-bar">
						<span :style="{ width: `${(l.value / (stats.total || 1)) * 100}%`, background: levelColor(l.name) }"></span>
					</div>
					<span class="eval-page__level-value">{{ l.value }} 人</span>
				</div>
			</NCard>
		</div>

		<div class="eval-page__list">
			<NPageBasic
				ref="pageRef"
				title="学生评价"
				row-key="id"
				:bars="bars"
				:cols="cols"
				:api="fetchData"
				:is-show-more-filter="true"
				@on-tb-event-watch="onTbAction"
			/>
		</div>

		<!-- 积分明细 -->
		<Dialog v-model="detailVisible" :title="`成长档案 · ${current.studentName || ''}`" width="760px" ok-text="关闭" @ok="detailVisible = false">
			<div class="eval-page__detail-head">
				<div class="eval-page__detail-item"><span>德育</span><strong>{{ current.moral }}</strong></div>
				<div class="eval-page__detail-item"><span>学业</span><strong>{{ current.academic }}</strong></div>
				<div class="eval-page__detail-item"><span>体育</span><strong>{{ current.physical }}</strong></div>
				<div class="eval-page__detail-item"><span>艺术</span><strong>{{ current.art }}</strong></div>
				<div class="eval-page__detail-item is-total"><span>总分</span><strong>{{ current.total }}</strong></div>
			</div>
			<ElTable :data="records" height="300" stripe>
				<ElTableColumn label="时间" prop="time" min-width="170" />
				<ElTableColumn label="类别" prop="category" min-width="90" />
				<ElTableColumn label="事由" prop="reason" min-width="220" />
				<ElTableColumn label="分值" min-width="80">
					<template #default="{ row }">
						<span :style="{ color: row.score >= 0 ? 'var(--sc-success)' : 'var(--sc-danger)', fontWeight: 600 }">
							{{ row.score > 0 ? "+" : "" }}{{ row.score }}
						</span>
					</template>
				</ElTableColumn>
				<ElTableColumn label="记录人" prop="operator" min-width="120" />
			</ElTable>
		</Dialog>

		<!-- 加减分 -->
		<Dialog v-model="addVisible" title="新增评价记录" :loading="submitting" width="520px" @ok="submitAdd">
			<Form ref="addFormRef" :items="addItems" :form-data="addData" :show-footer="false" label-width="90px" />
		</Dialog>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElTable, ElTableColumn } from "lmLibs/element-plus";
import NPageBasic from "lmCmpsBiz/NPageBasic";
import NCard from "lmCmpsBasic/NCard";
import Dialog from "lmCmpsBasic/Dialog";
import Form from "lmCmpsBasic/Form";
import type { FormItem } from "lmCmpsBasic/Form/types";
import { Input, Select, Number_ } from "lmIreposF";
import { useSimpleCols } from "lmHooks/tools/useCols";
import { useSimpleBars } from "lmHooks/tools/useBars";
import { $classOptionsGet } from "lmApisCampus/api/academic";
import { $evalPagePost, $evalRecordAddPost, $evalRecordsGet, $evalStatisticsGet } from "lmApisCampus/api/life";
import { sync } from "lmUtils/promise";

const pageRef = ref();
const addFormRef = ref();
const stats = ref<Record<string, any>>({});
const classOptions = ref<any[]>([]);
const detailVisible = ref(false);
const addVisible = ref(false);
const submitting = ref(false);
const records = ref<any[]>([]);
const current = ref<Record<string, any>>({});

const levelColor = (level: string) =>
	({ A: "#00B42A", B: "#165DFF", C: "#FF7D00", D: "#F53F3F" } as Record<string, string>)[level] || "#86909C";

const statCards = computed(() => [
	{ label: "参评学生", value: stats.value.total || 0, unit: "人" },
	{ label: "平均总分", value: stats.value.avg || 0, unit: "分" },
	{ label: "加分记录", value: stats.value.adds || 0, unit: "条" },
	{ label: "扣分记录", value: stats.value.subs || 0, unit: "条" }
]);

const bars = computed(() =>
	useSimpleBars([
		"姓名|studentName|input",
		"学号|studentNo|input",
		{
			bar: "班级|className|select",
			config: { props: { options: classOptions.value.map(c => ({ label: c.label, value: c.label })) } }
		},
		{
			bar: "等级|level|select",
			config: {
				props: {
					options: ["A", "B", "C", "D"].map(l => ({ label: `${l} 级`, value: l }))
				}
			}
		}
	])
);

const cols = computed(() =>
	useSimpleCols([
		"idx",
		"姓名|studentName|text|minWidth:100",
		"学号|studentNo|minWidth:130",
		"班级|className|minWidth:110",
		{ col: "德育|moral|text|minWidth:90", tdFn: (h: any, ctx: any) => h("span", {}, String(ctx.data.row.moral)) },
		{ col: "学业|academic|text|minWidth:90", tdFn: (h: any, ctx: any) => h("span", {}, String(ctx.data.row.academic)) },
		{ col: "体育|physical|text|minWidth:90", tdFn: (h: any, ctx: any) => h("span", {}, String(ctx.data.row.physical)) },
		{ col: "艺术|art|text|minWidth:90", tdFn: (h: any, ctx: any) => h("span", {}, String(ctx.data.row.art)) },
		{
			col: "总分|total|text|minWidth:90",
			tdFn: (h: any, ctx: any) => h("span", { style: { fontWeight: 600, color: "#165DFF" } }, String(ctx.data.row.total))
		},
		{
			col: "等级|level|tag|minWidth:90",
			setComProps: (row: any) => ({
				type: row.level === "A" ? "success" : row.level === "B" ? "primary" : row.level === "C" ? "warning" : "danger",
				text: `${row.level} 级`
			})
		},
		{ col: "记录数|records|text|minWidth:90-format:number" },
		{
			col: "actions|明细:detail-加减分:add",
			setComProps: { fixed: "right", minWidth: 160 }
		}
	])
);

const fetchData = (params: Record<string, any>) => $evalPagePost(params);

const addData = reactive<Record<string, any>>({ studentNo: "", studentName: "", score: 2, category: "品德", reason: "" });

const addItems = computed<FormItem[]>(() => [
	Input({ label: "学生", prop: "studentName", yours: { disabled: true } }),
	Number_({ label: "分值", prop: "score", rules: [{ required: true, message: "请输入分值", trigger: "blur" }], yours: { min: -10, max: 10 } }),
	Select({
		label: "类别",
		prop: "category",
		options: ["品德", "学业", "体育", "艺术", "实践", "纪律", "卫生"].map(c => ({ label: c, value: c }))
	}),
	Input({
		label: "事由",
		prop: "reason",
		type: "textarea",
		colProps: { span: 24 },
		rules: [{ required: true, message: "请填写事由", trigger: "blur" }],
		yours: { rows: 2 }
	})
]);

const loadStats = async () => {
	const [err, res] = await sync($evalStatisticsGet());
	if (!err) stats.value = (res as any) || {};
};

const openDetail = async (row: any) => {
	current.value = row;
	const [err, res] = await sync($evalRecordsGet({ studentNo: row.studentNo }));
	records.value = err ? [] : ((res as any) || []);
	detailVisible.value = true;
};

const openAdd = (row: any) => {
	current.value = row;
	Object.assign(addData, { studentNo: row.studentNo, studentName: row.studentName, score: 2, category: "品德", reason: "" });
	addVisible.value = true;
};

const submitAdd = async () => {
	const valid = await addFormRef.value?.__validForm?.();
	if (!valid) return;
	submitting.value = true;
	try {
		const [err] = await sync($evalRecordAddPost({ ...addData }));
		if (err) return;
		ElMessage.success("记录已添加");
		addVisible.value = false;
		pageRef.value.doSearch(true, "search");
		loadStats();
	} finally {
		submitting.value = false;
	}
};

const onTbAction = ({ key, data }: any) => {
	const row = data?.data?.row;
	if (key === "detail") openDetail(row);
	if (key === "add") openAdd(row);
};

onMounted(async () => {
	const [err, res] = await sync($classOptionsGet());
	if (!err) classOptions.value = res as any;
	loadStats();
});
</script>

<style lang="less">
.eval-page {
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

	&__levels {
		grid-column: 1 / -1;
	}

	&__level {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 8px;

		&:last-child {
			margin-bottom: 0;
		}

		&-name {
			width: 48px;
			font-size: 12.5px;
			color: var(--sc-text-2);
		}

		&-bar {
			flex: 1;
			height: 10px;
			border-radius: 5px;
			background: var(--sc-bg-sunken);
			overflow: hidden;

			span {
				display: block;
				height: 100%;
				border-radius: 5px;
			}
		}

		&-value {
			width: 56px;
			text-align: right;
			font-size: 12.5px;
			color: var(--sc-text-2);
		}
	}

	&__list {
		flex: 1;
		min-height: 0;
		display: flex;
	}

	&__detail-head {
		display: flex;
		gap: 10px;
		margin-bottom: 12px;
	}

	&__detail-item {
		flex: 1;
		padding: 10px 12px;
		border-radius: var(--sc-radius);
		background: var(--sc-bg);
		border: 1px solid var(--sc-border);
		text-align: center;

		span {
			display: block;
			font-size: 12px;
			color: var(--sc-text-3);
		}

		strong {
			font-size: 20px;
			color: var(--sc-text-1);
		}

		&.is-total {
			background: var(--sc-primary-soft);
			border-color: var(--sc-primary-border);

			strong {
				color: var(--sc-primary);
			}
		}
	}
}

@media (max-width: 1400px) {
	.eval-page__stats {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
}
</style>
