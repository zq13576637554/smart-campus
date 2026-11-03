<!-- 学生档案批量导入 -->
<template>
	<div class="page-container">
		<ImportPage
			title="学生档案批量导入"
			template-name="学生档案导入模板"
			:columns="columns"
			:submit-api="submitApi"
			@done="router.push('/xsgl/')"
		/>
	</div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { ElMessage } from "lmLibs/element-plus";
import ImportPage from "lmCmpsBiz/ImportPage";
import type { ImportColumn } from "lmCmpsBiz/ImportPage";
import { $studentImportPost } from "lmApisCampus/api/academic";
import { emitBackPageEvent } from "lmUtils/eventBus";

const router = useRouter();

const columns: ImportColumn[] = [
	{ label: "姓名", prop: "name", required: true, width: 100, tips: "张三" },
	{ label: "学号", prop: "studentNo", required: true, width: 130, tips: "202600001" },
	{
		label: "性别",
		prop: "gender",
		width: 80,
		validator: v => (v && !["男", "女"].includes(v) ? "性别只能填写男或女" : undefined)
	},
	{ label: "班级", prop: "className", required: true, width: 130, tips: "高一(1)班" },
	{
		label: "手机号",
		prop: "phone",
		width: 140,
		validator: v => (v && !/^1[3-9]\d{9}$/.test(v) ? "手机号格式不正确" : undefined)
	},
	{ label: "宿舍", prop: "dorm", width: 110 },
	{ label: "床位", prop: "bedNo", width: 90 },
	{ label: "监护人", prop: "guardian", width: 100 },
	{ label: "监护人电话", prop: "guardianPhone", width: 140 }
];

const submitApi = async (rows: Record<string, any>[]) => {
	const res = await $studentImportPost(rows);
	if (res.success) emitBackPageEvent({ type: "create-success" });
	if (!res.success && !res.failed?.length) ElMessage.warning("没有可导入的数据");
	return res;
};
</script>
