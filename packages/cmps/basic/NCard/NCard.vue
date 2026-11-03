<!-- 卡片容器 -->
<template>
	<div class="n-card" :class="{ 'is-hover': hover, 'is-border': border }">
		<div v-if="title || $slots.title || $slots.extra" class="n-card__header">
			<div class="n-card__title">
				<slot name="title">{{ title }}</slot>
			</div>
			<div class="n-card__extra">
				<slot name="extra"></slot>
			</div>
		</div>
		<div class="n-card__body">
			<slot></slot>
		</div>
	</div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ title?: string; hover?: boolean; border?: boolean }>(), { title: "", hover: false, border: true });
</script>

<style lang="less">
.n-card {
	background: var(--sc-card);
	border-radius: var(--sc-radius-lg);
	box-shadow: var(--sc-shadow-1);
	padding: 16px;
	border: 1px solid transparent;
	transition: box-shadow 0.2s, border-color 0.2s;

	&.is-border {
		border-color: var(--sc-border);
	}

	&.is-hover:hover {
		box-shadow: var(--sc-shadow-2);
	}

	&__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 14px;
		min-height: 22px;
	}

	&__title {
		position: relative;
		padding-left: 10px;
		font-size: 15px;
		font-weight: 600;
		color: var(--sc-text-1);

		&::before {
			content: "";
			position: absolute;
			left: 0;
			top: 50%;
			transform: translateY(-50%);
			width: 3px;
			height: 13px;
			border-radius: 2px;
			background: var(--sc-primary);
		}
	}

	&__extra {
		font-size: 12px;
		color: var(--sc-text-3);
	}
}
</style>
