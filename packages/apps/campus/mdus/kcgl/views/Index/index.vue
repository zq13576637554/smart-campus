<!-- 课程管理 -->
<template>
	<NPageBasic
		ref="pageRef"
		class="campus-kcgl-index"
		title="课程管理"
		row-key="id"
		:bars="_bars"
		:cols="_cols"
		:api="fetchData"
		:is-show-more-filter="true"
		@on-tb-event-watch="onTbAction"
		@loaded="onLoaded"
	>
		<template #handle-buttons>
			<ElButton type="primary" @click="openForm()">新增课程</ElButton>
		</template>
	</NPageBasic>

	<Dialog v-model="dialogVisible" :title="formData.id ? '编辑课程' : '新增课程'" :loading="submitting" width="680px" @ok="onSubmit">
		<Form ref="formRef" :items="formItems" :form-data="formData" :show-footer="false" label-width="100px" />
	</Dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElButton, ElMessage, ElMessageBox } from "lmLibs/element-plus";
import NPageBasic from "lmCmpsBiz/NPageBasic";
import Dialog from "lmCmpsBasic/Dialog";
import Form from "lmCmpsBasic/Form";
import type { FormItem } from "lmCmpsBasic/Form/types";
import { Input, Select, Number_, RenderTitle } from "lmIreposF";
import { $courseDeletePost, $coursePagePost, $courseSavePost } from "lmApisCampus/api/academic";
import { $teacherPagePost } from "lmApisCampus/api/staff";
import { sync } from "lmUtils/promise";
import getCols from "./config/cols";
import getBars from "./config/bar";

const pageRef = ref();
const formRef = ref();
const dialogVisible = ref(false);
const submitting = ref(false);
const teacherOptions = ref<{ label: string; value: string; raw?: any }[]>([]);
const totalCredit = ref(0);

const _cols = computed(() => getCols());
const _bars = computed(() => getBars());

const GRADES = ["高一", "高二", "高三"].map(g => ({ label: g, value: g }));
const TERMS = [
	{ label: "2025-2026 第一学期", value: "2025-1" },
	{ label: "2024-2025 第二学期", value: "2024-2" }
];

const formItems = computed<FormItem[]>(() => [
	RenderTitle({ label: "课程信息", prop: "__title__", colProps: { span: 24 } }),
	Input({
		label: "课程名称",
		prop: "courseName",
		rules: [{ required: true, message: "请输入课程名称", trigger: "blur" }],
		yours: { placeholder: "如 高一数学" }
	}),
	Input({ label: "课程编号", prop: "courseNo", yours: { placeholder: "如 KC0001" } }),
	Select({
		label: "授课教师",
		prop: "teacherId",
		rules: [{ required: true, message: "请选择授课教师", trigger: "change" }],
		yours: {
			placeholder: "请选择授课教师",
			options: teacherOptions.value,
			onChange: (val: string) => {
				const hit = teacherOptions.value.find(t => t.value === val);
				formData.teacherName = hit?.label || "";
			}
		}
	}),
	Select({
		label: "年级",
		prop: "grade",
		rules: [{ required: true, message: "请选择年级", trigger: "change" }],
		yours: { options: GRADES }
	}),
	Select({ label: "课程类型", prop: "type", type: "enumSelect", dictType: "COURSE_TYPE" }),
	Select({
		label: "学期",
		prop: "term",
		yours: { options: TERMS }
	}),
	Number_({ label: "学分", prop: "credit", yours: { min: 0, max: 10, step: 0.5 } }),
	Number_({ label: "课时", prop: "hours", yours: { min: 0, max: 200, step: 4 } }),
	Input({ label: "授课班级", prop: "className", yours: { placeholder: "如 高一(1)班" } })
]);

const formData = reactive<Record<string, any>>({
	id: "",
	courseName: "",
	courseNo: "",
	teacherId: "",
	teacherName: "",
	grade: "",
	type: "REQUIRED",
	term: "2025-1",
	credit: 2,
	hours: 36,
	className: ""
});

const fetchData = (params: Record<string, any>) => $coursePagePost(params);

const onLoaded = ({ list }: any) => {
	totalCredit.value = list.reduce((a: number, b: any) => a + Number(b.credit || 0), 0);
};

const loadTeachers = async () => {
	const [err, res] = await sync($teacherPagePost({ pageNumber: 1, pageSize: 200 }));
	if (err) return;
	teacherOptions.value = (res as any).content.map((t: any) => ({ label: t.name, value: t.id }));
};

const openForm = (row?: any, readonly = false) => {
	Object.assign(formData, {
		id: row?.id || "",
		courseName: row?.courseName || "",
		courseNo: row?.courseNo || "",
		teacherId: row?.teacherId || "",
		teacherName: row?.teacherName || "",
		grade: row?.grade || "",
		type: row?.type || "REQUIRED",
		term: row?.term || "2025-1",
		credit: row?.credit ?? 2,
		hours: row?.hours ?? 36,
		className: row?.className || ""
	});
	dialogVisible.value = true;
	if (readonly) dialogVisible.value = true;
};

const onSubmit = async () => {
	const valid = await formRef.value?.__validForm?.();
	if (!valid) return;
	submitting.value = true;
	try {
		const [err] = await sync($courseSavePost({ ...formData }));
		if (err) return;
		ElMessage.success("保存成功");
		dialogVisible.value = false;
		pageRef.value.doSearch(true, "search");
	} finally {
		submitting.value = false;
	}
};

const onDelete = async (row: any) => {
	const ok = await ElMessageBox.confirm(`确认删除课程「${row.courseName}」吗？`, "删除确认", { type: "warning" }).catch(() => false);
	if (!ok) return;
	const [err] = await sync($courseDeletePost({ id: row.id }));
	if (!err) {
		ElMessage.success("删除成功");
		pageRef.value.doSearch(true, "search");
	}
};

const onTbAction = ({ key, data }: any) => {
	const row = data?.data?.row;
	if (key === "view") openForm(row, true);
	if (key === "edit") openForm(row);
	if (key === "delete") onDelete(row);
};

onMounted(loadTeachers);
</script>
