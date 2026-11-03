<!-- 页面标题 -->
<template>
	<div class="n-page-title">
		<div class="n-page-title__left">
			<span class="n-page-title__bar"></span>
			<span class="n-page-title__text">{{ title }}</span>
			<span v-if="subTitle" class="n-page-title__sub">{{ subTitle }}</span>
		</div>
		<div class="n-page-title__right">
			<slot></slot>
		</div>
	</div>
</template>

<script setup lang="ts">
defineProps<{ title?: string; subTitle?: string }>();
</script>

<style lang="less">
.n-page-title {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 0 12px;

	&__left {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	&__bar {
		width: 4px;
		height: 16px;
		background: #165dff;
		border-radius: 2px;
	}

	&__text {
		font-size: 16px;
		font-weight: 600;
		color: #1d2129;
	}

	&__sub {
		font-size: 12px;
		color: #86909c;
	}
}
</style>
