<!-- 学生档案详情 -->
<template>
	<div class="page-container" v-loading="loading">
		<NCard>
			<div class="student-detail__hero">
				<div class="student-detail__avatar" :style="{ background: detail.avatarColor || '#165DFF' }">
					{{ detail.name?.slice(0, 1) }}
				</div>
				<div class="student-detail__meta">
					<h2>{{ detail.name || "--" }}</h2>
					<p>
						{{ detail.studentNo }} · {{ detail.className }} · {{ detail.grade }}
						<NTag :type="statusType" fill class="ml-8">{{ statusText }}</NTag>
					</p>
				</div>
				<div class="student-detail__actions">
					<ElButton @click="router.back()">返回</ElButton>
					<ElButton type="primary" @click="router.push({ path: '/xsgl/form/', query: { id: detail.id } })">
						编辑档案
					</ElButton>
				</div>
			</div>

			<ElDivider />

			<Form :items="items" :form-data="detail" :enable-detail-mode="true" :show-footer="false" />
		</NCard>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElButton, ElDivider, ElMessage } from "lmLibs/element-plus";
import NCard from "lmCmpsBasic/NCard";
import NTag from "lmCmpsBasic/NTag";
import Form from "lmCmpsBasic/Form";
import { $studentDetailGet } from "lmApisCampus/api/academic";
import { sync } from "lmUtils/promise";
import itemsFun from "../Form/config/conf.item";

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const detail = ref<Record<string, any>>({});

const items = computed(() => itemsFun([], []));

const STATUS: Record<string, { text: string; type: string }> = {
	STUDYING: { text: "在读", type: "success" },
	SUSPENDED: { text: "休学", type: "warning" },
	GRADUATED: { text: "毕业", type: "info" },
	QUIT: { text: "退学", type: "danger" }
};

const statusText = computed(() => STATUS[detail.value.status]?.text || "--");
const statusType = computed(() => STATUS[detail.value.status]?.type || "info");

onMounted(async () => {
	loading.value = true;
	try {
		const [err, res] = await sync($studentDetailGet({ id: route.query.id as string }));
		if (err || !res) {
			ElMessage.error("学生信息不存在");
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
.student-detail {
	&__hero {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	&__avatar {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 56px;
		height: 56px;
		border-radius: 14px;
		color: #fff;
		font-size: 22px;
		font-weight: 600;
	}

	&__meta {
		flex: 1;

		h2 {
			margin: 0 0 4px;
			font-size: 20px;
		}

		p {
			margin: 0;
			font-size: 13px;
			color: #86909c;
		}
	}
}

.ml-8 {
	margin-left: 8px;
}
</style>
