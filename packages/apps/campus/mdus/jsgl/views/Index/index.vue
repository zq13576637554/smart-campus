<!-- 教职工管理 -->
<template>
	<NPageBasic
		ref="pageRef"
		class="campus-jsgl-index"
		title="教职工管理"
		row-key="id"
		:bars="_bars"
		:cols="_cols"
		:api="fetchData"
		:is-show-more-filter="true"
		:fixed-show-item-len="3"
		@on-tb-event-watch="onTbAction"
	>
		<template #handle-buttons>
			<ElButton type="primary" @click="openForm()">新增教职工</ElButton>
		</template>
	</NPageBasic>

	<Dialog v-model="dialogVisible" :title="dialogTitle" :loading="submitting" :width="dialogReadonly ? '860px' : '760px'" @ok="onSubmit">
		<Form
			ref="formRef"
			:items="formItems"
			:form-data="formData"
			:enable-detail-mode="dialogReadonly"
			:show-footer="false"
			label-width="100px"
		/>
	</Dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { ElButton, ElMessage } from "lmLibs/element-plus";
import NPageBasic from "lmCmpsBiz/NPageBasic";
import Dialog from "lmCmpsBasic/Dialog";
import Form from "lmCmpsBasic/Form";
import type { FormItem } from "lmCmpsBasic/Form/types";
import { Input, Select, Radios, Date } from "lmIreposF";
import { $teacherDeletePost, $teacherPagePost, $teacherSavePost } from "lmApisCampus/api/staff";
import { sync } from "lmUtils/promise";
import { ElMessageBox } from "lmLibs/element-plus";
import getCols from "./config/cols";
import getBars from "./config/bar";

const pageRef = ref();
const formRef = ref();
const dialogVisible = ref(false);
const dialogReadonly = ref(false);
const submitting = ref(false);

const _cols = computed(() => getCols());
const _bars = computed(() => getBars());

const SUBJECTS = ["语文", "数学", "英语", "物理", "化学", "生物", "政治", "历史", "地理", "体育", "信息技术", "音乐", "美术"];

const formItems = computed<FormItem[]>(() => [
	Input({
		label: "姓名",
		prop: "name",
		rules: [{ required: true, message: "请输入姓名", trigger: "blur" }],
		yours: { placeholder: "请输入教师姓名" }
	}),
	Radios({
		label: "性别",
		prop: "gender",
		rules: [{ required: true, message: "请选择性别", trigger: "change" }],
		options: [
			{ label: "男", value: "M" },
			{ label: "女", value: "F" }
		]
	}),
	Input({
		label: "工号",
		prop: "teacherNo",
		rules: [{ required: true, message: "请输入工号", trigger: "blur" }],
		yours: { placeholder: "请输入工号" }
	}),
	Select({
		label: "任教学科",
		prop: "subject",
		rules: [{ required: true, message: "请选择学科", trigger: "change" }],
		yours: { placeholder: "请选择学科", options: SUBJECTS.map(s => ({ label: s, value: s })) }
	}),
	Select({
		label: "职称",
		prop: "title",
		type: "enumSelect",
		dictType: "TEACHER_TITLE",
		yours: { placeholder: "请选择职称" }
	}),
	Select({
		label: "在职状态",
		prop: "status",
		type: "enumSelect",
		dictType: "TEACHER_STATUS",
		yours: { placeholder: "请选择状态" }
	}),
	Input({
		label: "所属教研组",
		prop: "deptName",
		yours: { placeholder: "如 数学教研组" }
	}),
	Input({
		label: "联系电话",
		prop: "phone",
		rules: [{ pattern: /^1[3-9]\d{9}$/, message: "手机号格式不正确", trigger: "blur" }],
		yours: { placeholder: "请输入手机号", maxlength: 11 }
	}),
	Input({
		label: "邮箱",
		prop: "email",
		colProps: { span: 24 },
		yours: { placeholder: "请输入邮箱" }
	}),
	Date({
		label: "入职日期",
		prop: "joinDate",
		yours: { placeholder: "请选择入职日期", style: "width:100%" }
	})
]);

const formData = reactive<Record<string, any>>({
	id: "",
	name: "",
	gender: "M",
	teacherNo: "",
	subject: "",
	title: "LECTURER",
	status: "ON_JOB",
	deptName: "",
	phone: "",
	email: "",
	joinDate: ""
});

const dialogTitle = computed(() => (dialogReadonly.value ? "教职工详情" : formData.id ? "编辑教职工" : "新增教职工"));

const fetchData = (params: Record<string, any>) => $teacherPagePost(params);

const openForm = (row?: any, readonly = false) => {
	dialogReadonly.value = readonly;
	Object.assign(formData, {
		id: row?.id || "",
		name: row?.name || "",
		gender: row?.gender || "M",
		teacherNo: row?.teacherNo || "",
		subject: row?.subject || "",
		title: row?.title || "LECTURER",
		status: row?.status || "ON_JOB",
		deptName: row?.deptName || "",
		phone: row?.phone || "",
		email: row?.email || "",
		joinDate: row?.joinDate || ""
	});
	dialogVisible.value = true;
};

const onSubmit = async () => {
	if (dialogReadonly.value) {
		dialogVisible.value = false;
		return;
	}
	const valid = await formRef.value?.__validForm?.();
	if (!valid) return;

	submitting.value = true;
	try {
		const [err] = await sync($teacherSavePost({ ...formData }));
		if (err) return;
		ElMessage.success("保存成功");
		dialogVisible.value = false;
		pageRef.value.doSearch(true, "search");
	} finally {
		submitting.value = false;
	}
};

const onDelete = async (row: any) => {
	const ok = await ElMessageBox.confirm(`确认删除教师「${row.name}」吗？`, "删除确认", { type: "warning" }).catch(() => false);
	if (!ok) return;
	const [err] = await sync($teacherDeletePost({ id: row.id }));
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
