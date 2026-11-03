<!-- 统计卡片组 -->
<template>
	<div class="n-summary-card">
		<div v-for="(item, i) in summaryData" :key="i" class="n-summary-card__item" :class="`is-${item.type || 'primary'}`">
			<div class="n-summary-card__label">
				{{ item.label }}
				<ElTooltip v-if="item.tips" :content="item.tips" placement="top">
					<ElIcon class="n-summary-card__tips"><QuestionFilled /></ElIcon>
				</ElTooltip>
			</div>
			<div class="n-summary-card__value">
				{{ item.value }}
				<span v-if="item.unit" class="n-summary-card__unit">{{ item.unit }}</span>
			</div>
			<div v-if="item.trend !== undefined" class="n-summary-card__trend" :class="item.trend >= 0 ? 'is-up' : 'is-down'">
				{{ item.trend >= 0 ? "↑" : "↓" }} {{ Math.abs(item.trend) }}%
				<span class="n-summary-card__trend-text">{{ item.trendText || "较上月" }}</span>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { QuestionFilled } from "@element-plus/icons-vue";
import { ElIcon, ElTooltip } from "lmLibs/element-plus";

interface SummaryItem {
	label: string;
	value: string | number;
	unit?: string;
	type?: "primary" | "success" | "warning" | "danger";
	trend?: number;
	trendText?: string;
	tips?: string;
}

withDefaults(defineProps<{ summaryData?: SummaryItem[] }>(), { summaryData: () => [] });
</script>

<style lang="less">
.n-summary-card {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	gap: 12px;
	margin-bottom: 0;

	&__item {
		position: relative;
		padding: 16px 18px;
		background: var(--sc-card);
		border-radius: var(--sc-radius-lg);
		overflow: hidden;
		border: 1px solid var(--sc-border);
		box-shadow: var(--sc-shadow-1);
		transition: box-shadow 0.2s, transform 0.2s;

		&:hover {
			box-shadow: var(--sc-shadow-2);
		}

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

		&.is-success::before {
			background: var(--sc-success);
		}

		&.is-warning::before {
			background: var(--sc-warning);
		}

		&.is-danger::before {
			background: var(--sc-danger);
		}
	}

	&__label {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 12.5px;
		color: var(--sc-text-3);
	}

	&__tips {
		font-size: 12px;
		cursor: help;
	}

	&__value {
		margin-top: 6px;
		font-size: 26px;
		font-weight: 700;
		line-height: 1.2;
		color: var(--sc-text-1);
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.5px;
	}

	&__unit {
		margin-left: 3px;
		font-size: 12.5px;
		font-weight: 400;
		color: var(--sc-text-3);
		letter-spacing: 0;
	}

	&__trend {
		margin-top: 6px;
		font-size: 12px;

		&.is-up {
			color: var(--sc-success);
		}

		&.is-down {
			color: var(--sc-danger);
		}
	}

	&__trend-text {
		margin-left: 4px;
		color: var(--sc-text-3);
	}
}
</style>
