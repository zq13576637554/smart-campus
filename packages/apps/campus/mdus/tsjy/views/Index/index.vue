<!-- 图书馆借阅 -->
<template>
	<div class="page-container book-page">
		<div class="book-page__stats">
			<div v-for="item in statCards" :key="item.label" class="book-page__stat" :class="`is-${item.type}`">
				<div class="book-page__stat-label">{{ item.label }}</div>
				<div class="book-page__stat-value">{{ item.value }}<em>{{ item.unit }}</em></div>
			</div>
			<NCard title="热门借阅 TOP5" class="book-page__hot">
				<div class="book-page__hot-list">
					<div v-for="(b, i) in stats.hot || []" :key="b.name" class="book-page__hot-item">
						<span class="book-page__hot-no" :class="`is-${i + 1}`">{{ i + 1 }}</span>
						<span class="book-page__hot-name">{{ b.name }}</span>
						<div class="book-page__hot-bar">
							<span :style="{ width: `${(b.value / maxHot) * 100}%` }"></span>
						</div>
						<span class="book-page__hot-value">{{ b.value }} 次</span>
					</div>
				</div>
			</NCard>
		</div>

		<div class="book-page__list">
			<NPageBasic
				ref="pageRef"
				title="借阅记录"
				row-key="id"
				:bars="bars"
				:cols="cols"
				:api="fetchData"
				@on-tb-event-watch="onTbAction"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "lmLibs/element-plus";
import NPageBasic from "lmCmpsBiz/NPageBasic";
import NCard from "lmCmpsBasic/NCard";
import { useSimpleCols } from "lmHooks/tools/useCols";
import { useSimpleBars } from "lmHooks/tools/useBars";
import { $bookPagePost, $bookReturnPost, $bookStatisticsGet } from "lmApisCampus/api/life";
import { sync } from "lmUtils/promise";

const pageRef = ref();
const stats = ref<Record<string, any>>({});

const STATUS: Record<string, { text: string; type: string }> = {
	BORROWED: { text: "借出中", type: "primary" },
	OVERDUE: { text: "已逾期", type: "danger" },
	RETURNED: { text: "已归还", type: "success" }
};

const statCards = computed(() => [
	{ label: "借阅总数", value: stats.value.total || 0, unit: "次", type: "primary" },
	{ label: "借出中", value: stats.value.borrowed || 0, unit: "本", type: "info" },
	{ label: "已逾期", value: stats.value.overdue || 0, unit: "本", type: "danger" },
	{ label: "已归还", value: stats.value.returned || 0, unit: "本", type: "success" }
]);

const maxHot = computed(() => Math.max(...(stats.value.hot || []).map((h: any) => h.value), 1));

const bars = computed(() =>
	useSimpleBars([
		"书名|bookName|input",
		"借阅人|borrower|input",
		{
			bar: "状态|status|select",
			config: {
				props: {
					options: Object.keys(STATUS).map(k => ({ label: STATUS[k].text, value: k }))
				}
			}
		}
	])
);

const cols = computed(() =>
	useSimpleCols([
		"idx",
		"书名|bookName|text|minWidth:160",
		"作者|author|minWidth:110",
		"ISBN|isbn|minWidth:160",
		"借阅人|borrower|minWidth:100",
		"学号|studentNo|minWidth:130",
		"借出日期|borrowDate|minWidth:120",
		"应还日期|dueDate|minWidth:120",
		"归还日期|returnDate|minWidth:120",
		{
			col: "状态|status|tag|minWidth:100",
			setComProps: (row: any) => ({ type: STATUS[row.status]?.type || "info", text: STATUS[row.status]?.text || row.status })
		},
		{
			col: "actions|归还:return",
			setComProps: {
				fixed: "right",
				width: 100,
				cmds: (row: any) => (row.status === "RETURNED" ? [] : [{ text: "归还", action: "return" }])
			}
		}
	])
);

const fetchData = (params: Record<string, any>) => $bookPagePost(params);

const loadStats = async () => {
	const [err, res] = await sync($bookStatisticsGet());
	if (!err) stats.value = (res as any) || {};
};

const onTbAction = async ({ key, data }: any) => {
	if (key !== "return") return;
	const row = data?.data?.row;
	const ok = await ElMessageBox.confirm(`确认归还《${row.bookName}》？`, "归还确认", { type: "warning" }).catch(() => false);
	if (!ok) return;
	const [err] = await sync($bookReturnPost({ id: row.id }));
	if (!err) {
		ElMessage.success("归还成功");
		pageRef.value.doSearch(true, "search");
		loadStats();
	}
};

onMounted(loadStats);
</script>

<style lang="less">
.book-page {
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
		border-left: 3px solid var(--sc-primary);

		&.is-danger {
			border-left-color: var(--sc-danger);
		}

		&.is-success {
			border-left-color: var(--sc-success);
		}

		&.is-info {
			border-left-color: var(--sc-info);
		}

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
	}

	&__hot-list {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 8px 32px;
	}

	&__hot-item {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	&__hot-no {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		border-radius: 4px;
		background: var(--sc-bg-sunken);
		color: var(--sc-text-3);
		font-size: 11px;

		&.is-1 {
			background: var(--sc-warning-soft);
			color: #b87400;
		}

		&.is-2 {
			background: #eef1f5;
			color: #6b7280;
		}

		&.is-3 {
			background: #ffe9dd;
			color: #b25900;
		}
	}

	&__hot-name {
		width: 130px;
		font-size: 12.5px;
		color: var(--sc-text-2);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	&__hot-bar {
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

	&__hot-value {
		width: 50px;
		text-align: right;
		font-size: 12px;
		color: var(--sc-text-3);
	}

	&__list {
		flex: 1;
		min-height: 0;
		display: flex;
	}
}

@media (max-width: 1400px) {
	.book-page__stats {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.book-page__hot-list {
		grid-template-columns: 1fr;
	}
}
</style>
