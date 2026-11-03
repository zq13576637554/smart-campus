<!-- 通用批量导入：按类型切换列定义 -->
<template>
	<div class="page-container generic-import">
		<div class="generic-import__bar">
			<span class="generic-import__label">数据类型</span>
			<ElSelect v-model="type" class="generic-import__select" @change="onTypeChange">
				<ElOption v-for="o in IMPORT_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
			</ElSelect>
			<ElButton link type="primary" @click="router.push('/dzzx/')">← 返回导入导出中心</ElButton>
		</div>

		<ImportPage
			:key="type"
			:title="def.title"
			:template-name="def.templateName"
			:columns="def.columns"
			:submit-api="def.submitApi"
			@done="onDone"
		/>
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElButton, ElMessage, ElOption, ElSelect } from "lmLibs/element-plus";
import ImportPage from "lmCmpsBiz/ImportPage";
import { IMPORT_DEFS, IMPORT_OPTIONS } from "lmApisCampus/import/defs";

const route = useRoute();
const router = useRouter();

const type = ref(String(route.query.type || "student"));

/** 类型非法时回退到学生 */
const def = computed(() => IMPORT_DEFS[type.value] || IMPORT_DEFS.student);

const onTypeChange = (val: string) => {
	router.replace({ path: "/dzzx/import/", query: { type: val } });
};

const onDone = () => {
	ElMessage.success("导入完成");
	router.push("/dzzx/");
};
</script>

<style lang="less">
.generic-import {
	&__bar {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 12px;
		padding: 10px 14px;
		background: var(--sc-card);
		border-radius: var(--sc-radius-lg);
		box-shadow: var(--sc-shadow-1);
	}

	&__label {
		font-size: 13px;
		color: var(--sc-text-2);
	}

	&__select {
		width: 180px;
	}

	@media (max-width: 768px) {
		&__bar {
			flex-wrap: wrap;
		}
	}
}
</style>
