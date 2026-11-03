<!-- 班级管理 -->
<template>
	<NPageBasic
		ref="pageRef"
		class="campus-bjgl-index"
		title="班级管理"
		row-key="id"
		:bars="_bars"
		:cols="_cols"
		:api="fetchData"
		@on-tb-event-watch="onTbAction"
	>
		<template #handle-buttons>
			<ElButton type="primary" @click="openForm()">新增班级</ElButton>
		</template>
	</NPageBasic>

	<Dialog v-model="dialogVisible" :title="formData.id ? '编辑班级' : '新增班级'" :loading="submitting" width="620px" @ok="onSubmit">
		<Form ref="formRef" :items="formItems" :form-data="formData" :show-footer="false" label-width="100px" />
	</Dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { ElButton, ElMessage, ElMessageBox } from "lmLibs/element-plus";
import NPageBasic from "lmCmpsBiz/NPageBasic";
import Dialog from "lmCmpsBasic/Dialog";
import Form from "lmCmpsBasic/Form";
import type { FormItem } from "lmCmpsBasic/Form/types";
import { Input, Select, Number_ } from "lmIreposF";
import { $classDeletePost, $classPagePost, $classSavePost } from "lmApisCampus/api/academic";
import { sync } from "lmUtils/promise";
import getCols from "./config/cols";
import getBars from "./config/bar";

const pageRef = ref();
const formRef = ref();
const dialogVisible = ref(false);
const submitting = ref(false);
const readonly = ref(false);

const _cols = computed(() => getCols());
const _bars = computed(() => getBars());

const GRADES = ["高一", "高二", "高三"].map(g => ({ label: g, value: g }));
const MAJORS = ["理科", "文科", "综合"].map(g => ({ label: g, value: g }));

const formItems = computed<FormItem[]>(() => [
	Input({ label: "班级名称", prop: "className", rules: [{ required: true, message: "请输入班级名称", trigger: "blur" }], yours: { placeholder: "如 高一(1)班" } }),
	Input({ label: "班级编号", prop: "classNo", yours: { placeholder: "如 G202401" } }),
	Select({ label: "年级", prop: "grade", rules: [{ required: true, message: "请选择年级", trigger: "change" }], yours: { options: GRADES } }),
	Select({ label: "文理方向", prop: "major", yours: { options: MAJORS } }),
	Input({ label: "班主任", prop: "headTeacher", yours: { placeholder: "请输入班主任姓名" } }),
	Input({ label: "教室", prop: "room", yours: { placeholder: "如 博学楼301" } }),
	Number_({ label: "班级人数", prop: "studentCount", yours: { min: 0, max: 80 } })
]);

const formData = reactive<Record<string, any>>({
	id: "",
	className: "",
	classNo: "",
	grade: "",
	major: "综合",
	headTeacher: "",
	room: "",
	studentCount: 0
});

const fetchData = (params: Record<string, any>) => $classPagePost(params);

const openForm = (row?: any, isView = false) => {
	readonly.value = isView;
	Object.assign(formData, {
		id: row?.id || "",
		className: row?.className || "",
		classNo: row?.classNo || "",
		grade: row?.grade || "",
		major: row?.major || "综合",
		headTeacher: row?.headTeacher || "",
		room: row?.room || "",
		studentCount: row?.studentCount || 0
	});
	dialogVisible.value = true;
};

const onSubmit = async () => {
	if (readonly.value) {
		dialogVisible.value = false;
		return;
	}
	const valid = await formRef.value?.__validForm?.();
	if (!valid) return;
	submitting.value = true;
	try {
		const [err] = await sync($classSavePost({ ...formData }));
		if (err) return;
		ElMessage.success("保存成功");
		dialogVisible.value = false;
		pageRef.value.doSearch(true, "search");
	} finally {
		submitting.value = false;
	}
};

const onDelete = async (row: any) => {
	const ok = await ElMessageBox.confirm(`确认删除班级「${row.className}」吗？`, "删除确认", { type: "warning" }).catch(() => false);
	if (!ok) return;
	const [err] = await sync($classDeletePost({ id: row.id }));
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
</script>
