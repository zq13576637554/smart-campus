<!-- 公告详情 -->
<template>
	<div class="page-container notice-detail" v-loading="loading">
		<NCard>
			<div class="notice-detail__head">
				<h1>{{ detail.title || "--" }}</h1>
				<div class="notice-detail__meta">
					<NTag :type="typeTag" fill>{{ typeText }}</NTag>
					<span>{{ detail.publisher }}</span>
					<span>{{ detail.publishTime }}</span>
					<span>阅读 {{ detail.readCount || 0 }}</span>
				</div>
			</div>
			<ElDivider />
			<article class="notice-detail__content">{{ detail.content }}</article>
			<div class="notice-detail__footer">
				<ElButton @click="router.back()">返回列表</ElButton>
			</div>
		</NCard>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElButton, ElDivider, ElMessage } from "lmLibs/element-plus";
import NCard from "lmCmpsBasic/NCard";
import NTag from "lmCmpsBasic/NTag";
import { $noticeDetailGet } from "lmApisCampus/api/system";
import { sync } from "lmUtils/promise";

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const detail = ref<Record<string, any>>({});

const TYPE: Record<string, { text: string; tag: string }> = {
	NOTICE: { text: "通知", tag: "primary" },
	ANNOUNCEMENT: { text: "公告", tag: "info" },
	WARNING: { text: "预警", tag: "danger" }
};

const typeText = computed(() => TYPE[detail.value.type]?.text || "--");
const typeTag = computed(() => TYPE[detail.value.type]?.tag || "info");

onMounted(async () => {
	loading.value = true;
	try {
		const [err, res] = await sync($noticeDetailGet({ id: route.query.id as string }));
		if (err || !res) {
			ElMessage.error("公告不存在");
			router.back();
			return;
		}
		detail.value = res as any;
	} finally {
		loading.value = false;
	}
});
</script>

<style lang="less">
.notice-detail {
	overflow: auto;

	&__head {
		text-align: center;

		h1 {
			margin: 8px 0 12px;
			font-size: 22px;
			color: #1d2129;
		}
	}

	&__meta {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 14px;
		font-size: 12px;
		color: #86909c;
	}

	&__content {
		display: block;
		max-width: 860px;
		margin: 0 auto;
		padding: 8px 0 24px;
		font-size: 14px;
		line-height: 2;
		color: #4e5969;
		white-space: pre-wrap;
	}

	&__footer {
		display: flex;
		justify-content: center;
		padding-top: 12px;
		border-top: 1px solid #f2f3f5;
	}
}
</style>
