<!-- 智慧宿舍 -->
<template>
	<div class="page-container dorm-page">
		<div class="dorm-page__head">
			<div class="dorm-page__stats">
				<div v-for="item in statCards" :key="item.label" class="dorm-page__stat">
					<div class="dorm-page__stat-label">{{ item.label }}</div>
					<div class="dorm-page__stat-value">{{ item.value }}<em>{{ item.unit }}</em></div>
				</div>
			</div>
			<NCard title="各楼栋床位使用率" class="dorm-page__buildings">
				<div v-for="b in stats.byBuilding || []" :key="b.name" class="dorm-page__building">
					<span class="dorm-page__building-name">{{ b.name }}</span>
					<div class="dorm-page__building-bar">
						<span :style="{ width: `${(b.used / b.total) * 100}%` }"></span>
					</div>
					<span class="dorm-page__building-num">{{ b.used }}/{{ b.total }}</span>
				</div>
			</NCard>
		</div>

		<div class="dorm-page__list">
			<NPageBasic
				ref="pageRef"
				title="宿舍房间"
				row-key="id"
				:bars="_bars"
				:cols="_cols"
				:api="fetchData"
				:transform-records="transformRecords"
				:tb-props="{ maxHeight: '100%' }"
			>
				<template #tb-expand="{ data }">
					<div class="dorm-page__members">
						<div v-for="stu in data.row.students" :key="stu.studentNo" class="dorm-page__member">
							<span class="dorm-page__member-avatar">{{ stu.name?.slice(0, 1) }}</span>
							<span>{{ stu.name }}</span>
							<span class="dorm-page__member-no">{{ stu.studentNo }}</span>
							<span class="dorm-page__member-bed">{{ stu.bedNo }}</span>
						</div>
					</div>
				</template>
			</NPageBasic>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElCol, ElRow } from "lmLibs/element-plus";
import NPageBasic from "lmCmpsBiz/NPageBasic";
import NCard from "lmCmpsBasic/NCard";
import { useSimpleCols } from "lmHooks/tools/useCols";
import { useSimpleBars } from "lmHooks/tools/useBars";
import { $dormPagePost, $dormStatisticsGet } from "lmApisCampus/api/staff";
import { sync } from "lmUtils/promise";

const pageRef = ref();
const stats = ref<Record<string, any>>({});

const statCards = computed(() => [
	{ label: "宿舍房间", value: stats.value.rooms || 0, unit: "间" },
	{ label: "总床位", value: stats.value.totalBeds || 0, unit: "个" },
	{ label: "已入住", value: stats.value.usedBeds || 0, unit: "人" },
	{ label: "床位使用率", value: stats.value.usageRate || 0, unit: "%" }
]);

const _bars = computed(() =>
	useSimpleBars([
		"房间号|roomNo|input",
		{
			bar: "楼栋|building|select",
			config: {
				props: {
					options: ["A 栋", "B 栋", "C 栋", "D 栋"].map(b => ({ label: b, value: b }))
				}
			}
		},
		{
			bar: "房间状态|status|enum-type:DORM_STATUS",
			config: { itemValue: "" }
		}
	])
);

const _cols = computed(() =>
	useSimpleCols([
		{ label: "", prop: "__expand__", type: "expand", width: 44 },
		"楼栋|building|minWidth:90",
		"房间号|roomNo|text|minWidth:110",
		"楼层|floor|text|minWidth:80-format:number",
		"床位容量|capacity|text|minWidth:100-format:number",
		"已入住|used|text|minWidth:90-format:number",
		{
			col: "入住率|rate|progress|minWidth:170"
		},
		{
			col: "房间状态|status|tag|minWidth:100",
			setComProps: { dictType: "DORM_STATUS" }
		},
		"宿管员|manager|minWidth:100"
	])
);

/** 入住率进度条需要百分比，这里把 used 换算成 rate 字段 */
const transformRecords = (list: any[]) =>
	list.map(item => ({ ...item, rate: Math.round((item.used / item.capacity) * 100) }));

const fetchData = (params: Record<string, any>) => $dormPagePost(params);

onMounted(async () => {
	const [err, res] = await sync($dormStatisticsGet());
	if (!err) stats.value = (res as any) || {};
});
</script>

<style lang="less">
.dorm-page {
	&__head {
		display: flex;
		gap: 12px;
	}

	&__stats {
		flex: 0 0 380px;
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
	}

	&__stat {
		position: relative;
		padding: 16px 18px;
		background: var(--sc-card);
		border: 1px solid var(--sc-border);
		border-radius: var(--sc-radius-lg);
		box-shadow: var(--sc-shadow-1);
		overflow: hidden;

		&::before {
			content: "";
			position: absolute;
			left: 0;
			top: 14px;
			bottom: 14px;
			width: 3px;
			border-radius: 0 3px 3px 0;
			background: var(--sc-primary);
		}

		&:nth-child(2)::before {
			background: var(--sc-success);
		}

		&:nth-child(3)::before {
			background: var(--sc-warning);
		}

		&:nth-child(4)::before {
			background: #722ed1;
		}

		&-label {
			font-size: 12.5px;
			color: var(--sc-text-3);
		}

		&-value {
			margin-top: 6px;
			font-size: 24px;
			font-weight: 700;
			line-height: 1.2;
			color: var(--sc-text-1);
			font-variant-numeric: tabular-nums;

			em {
				margin-left: 3px;
				font-size: 12.5px;
				font-style: normal;
				font-weight: 400;
				color: var(--sc-text-3);
			}
		}
	}

	&__buildings {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	&__building {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 8px;

		&-name {
			width: 42px;
			font-size: 12px;
			color: #4e5969;
		}

		&-bar {
			flex: 1;
			height: 10px;
			border-radius: 5px;
			background: #f2f3f5;
			overflow: hidden;

			span {
				display: block;
				height: 100%;
				border-radius: 5px;
				background: linear-gradient(90deg, #165dff, #4080ff);
			}
		}

		&-num {
			width: 60px;
			text-align: right;
			font-size: 12px;
			color: #86909c;
			font-variant-numeric: tabular-nums;
		}
	}

	&__list {
		flex: 1;
		min-height: 360px;
		display: flex;
	}

	&__members {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		padding: 4px 12px 12px 44px;
	}

	&__member {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 10px;
		border-radius: 6px;
		background: var(--sc-bg);
		font-size: 12px;

		&-avatar {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 20px;
			height: 20px;
			border-radius: 50%;
			background: #165dff;
			color: #fff;
			font-size: 11px;
		}

		&-no {
			color: #86909c;
		}

		&-bed {
			padding: 0 6px;
			border-radius: 3px;
			background: #e8f3ff;
			color: #165dff;
		}
	}
}

@media (max-width: 1200px) {
	.dorm-page__head {
		flex-direction: column;
	}

	.dorm-page__stats {
		flex: none;
	}
}
</style>
