<!-- 校车管理 -->
<template>
	<div class="page-container bus-page">
		<div class="bus-page__stats">
			<div v-for="item in statCards" :key="item.label" class="bus-page__stat" :class="`is-${item.type}`">
				<div class="bus-page__stat-label">{{ item.label }}</div>
				<div class="bus-page__stat-value">{{ item.value }}<em>{{ item.unit }}</em></div>
			</div>
		</div>

		<div class="bus-page__grid">
			<div v-for="bus in buses" :key="bus.id" class="bus-page__card">
				<div class="bus-page__card-head">
					<span class="bus-page__route">{{ bus.routeName }}</span>
					<NTag :type="bus.status === 'RUNNING' ? 'success' : 'info'" fill>
						{{ bus.status === "RUNNING" ? "运行中" : "停运维护" }}
					</NTag>
				</div>

				<div class="bus-page__plate">{{ bus.plateNo }}</div>

				<div class="bus-page__meta">
					<div><span>司机</span><strong>{{ bus.driver }}</strong></div>
					<div><span>站点</span><strong>{{ bus.stops }} 个</strong></div>
					<div><span>运行时间</span><strong>{{ bus.startTime }} - {{ bus.endTime }}</strong></div>
				</div>

				<div class="bus-page__load">
					<span class="bus-page__load-label">乘坐率</span>
					<span class="bus-page__load-value">{{ bus.riders }}/{{ bus.capacity }}</span>
				</div>
				<ElProgress
					:percentage="Math.round((bus.riders / bus.capacity) * 100)"
					:stroke-width="8"
					:color="bus.riders / bus.capacity > 0.9 ? '#F53F3F' : bus.riders / bus.capacity > 0.7 ? '#FF7D00' : '#165DFF'"
				/>

				<div class="bus-page__actions">
					<ElButton size="small" @click="toggle(bus)">
						{{ bus.status === "RUNNING" ? "停运维护" : "恢复运行" }}
					</ElButton>
					<ElButton size="small" type="primary" plain @click="notify(bus)">通知家长</ElButton>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElButton, ElMessage, ElProgress } from "lmLibs/element-plus";
import NTag from "lmCmpsBasic/NTag";
import { $busListGet, $busSavePost, $busStatisticsGet } from "lmApisCampus/api/life";
import { sync } from "lmUtils/promise";

const buses = ref<any[]>([]);
const stats = ref<Record<string, any>>({});

const statCards = computed(() => [
	{ label: "线路总数", value: stats.value.routes || 0, unit: "条", type: "primary" },
	{ label: "运行中", value: stats.value.running || 0, unit: "条", type: "success" },
	{ label: "乘车学生", value: stats.value.riders || 0, unit: "人", type: "warning" },
	{ label: "总座位", value: stats.value.capacity || 0, unit: "座", type: "info" }
]);

const load = async () => {
	const [err, res] = await sync($busListGet());
	if (!err) buses.value = (res as any) || [];
	const [e2, r2] = await sync($busStatisticsGet());
	if (!e2) stats.value = (r2 as any) || {};
};

const toggle = async (bus: any) => {
	const next = bus.status === "RUNNING" ? "MAINTAIN" : "RUNNING";
	const [err] = await sync($busSavePost({ id: bus.id, status: next }));
	if (!err) {
		ElMessage.success(next === "RUNNING" ? "已恢复运行" : "已停运维护");
		load();
	}
};

const notify = (bus: any) => {
	ElMessage.success(`已向「${bus.routeName}」${bus.riders} 位学生家长推送通知`);
};

onMounted(load);
</script>

<style lang="less">
.bus-page {
	&__stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
		gap: 12px;
	}

	&__stat {
		padding: 16px 18px;
		background: var(--sc-card);
		border: 1px solid var(--sc-border);
		border-radius: var(--sc-radius-lg);
		box-shadow: var(--sc-shadow-1);
		border-left: 3px solid var(--sc-primary);

		&.is-success {
			border-left-color: var(--sc-success);
		}

		&.is-warning {
			border-left-color: var(--sc-warning);
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

	&__grid {
		flex: 1;
		min-height: 0;
		overflow: auto;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
		gap: 12px;
		align-content: start;
	}

	&__card {
		display: flex;
		flex-direction: column;
		padding: 16px 18px;
		background: var(--sc-card);
		border: 1px solid var(--sc-border);
		border-radius: var(--sc-radius-lg);
		box-shadow: var(--sc-shadow-1);
		transition: box-shadow 0.2s;

		&:hover {
			box-shadow: var(--sc-shadow-2);
		}

		&-head {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 8px;
		}
	}

	&__route {
		font-size: 15px;
		font-weight: 600;
		color: var(--sc-text-1);
	}

	&__plate {
		margin-top: 6px;
		font-size: 13px;
		color: var(--sc-primary);
		font-family: Menlo, Consolas, monospace;
		letter-spacing: 1px;
	}

	&__meta {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
		margin: 12px 0;
		padding: 10px 0;
		border-top: 1px dashed var(--sc-border);
		border-bottom: 1px dashed var(--sc-border);

		div {
			display: flex;
			flex-direction: column;
			gap: 2px;
		}

		span {
			font-size: 11.5px;
			color: var(--sc-text-3);
		}

		strong {
			font-size: 12.5px;
			font-weight: 500;
			color: var(--sc-text-1);
		}
	}

	&__load {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 4px;
		font-size: 12.5px;

		&-label {
			color: var(--sc-text-3);
		}

		&-value {
			color: var(--sc-text-2);
			font-variant-numeric: tabular-nums;
		}
	}

	&__actions {
		display: flex;
		gap: 8px;
		margin-top: 14px;
	}
}
</style>
