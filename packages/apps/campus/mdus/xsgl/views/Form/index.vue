<!-- 学生档案编辑 -->
<template>
	<div class="page-container">
		<NCard :title="isEdit ? '编辑学生档案' : '新增学生档案'">
			<Form
				ref="formRef"
				:items="items"
				:form-data="formData"
				mode="fixed"
				label-width="110px"
				:is-form-page="true"
				:loading="submitting"
				ok-text="保存"
				cancel-text="取消"
				:show-footer="true"
				@ok="onSubmit"
				@reset="onCancel"
			/>
		</NCard>
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "lmLibs/element-plus";
import NCard from "lmCmpsBasic/NCard";
import Form from "lmCmpsBasic/Form";
import { useAppStore } from "lmStore/modules/app";
import { $classOptionsGet, $studentDetailGet, $studentSavePost } from "lmApisCampus/api/academic";
import { sync } from "lmUtils/promise";
import { emitBackPageEvent } from "lmUtils/eventBus";
import itemsFun from "./config/conf.item";

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();

const formRef = ref();
const submitting = ref(false);
const isEdit = computed(() => !!route.query.id);

const classOptions = ref<{ label: string; value: string }[]>([]);
const gradeOptions = [
	{ label: "高一", value: "高一" },
	{ label: "高二", value: "高二" },
	{ label: "高三", value: "高三" }
];

const items = computed(() => itemsFun(classOptions.value, gradeOptions));

const formData = reactive<Record<string, any>>({
	name: "",
	gender: "M",
	studentNo: "",
	birthday: "",
	classId: "",
	grade: "",
	status: "STUDYING",
	enrollDate: "",
	dorm: "",
	bedNo: "",
	phone: "",
	idCard: "",
	guardian: "",
	guardianPhone: "",
	address: "",
	remark: "",
	files: []
});

const loadClasses = async () => {
	const [err, res] = await sync($classOptionsGet());
	if (!err) classOptions.value = res as any;
};

const loadDetail = async () => {
	if (!route.query.id) return;
	const [err, res] = await sync($studentDetailGet({ id: route.query.id as string }));
	if (err || !res) {
		ElMessage.error("学生信息不存在");
		router.back();
		return;
	}
	Object.assign(formData, res);
};

const onSubmit = async (data: Record<string, any>) => {
	submitting.value = true;
	try {
		const [err] = await sync($studentSavePost({ ...data, id: route.query.id }));
		if (err) return;
		ElMessage.success(isEdit.value ? "保存成功" : "新增成功");
		emitBackPageEvent({ type: isEdit.value ? "edit-success" : "create-success" });
		router.push("/xsgl/");
	} finally {
		submitting.value = false;
	}
};

const onCancel = () => {
	router.push("/xsgl/");
};

onMounted(async () => {
	await loadClasses();
	await loadDetail();
	appStore.setSystemConfig({ ...appStore.getSystemConfig, lastVisited: "xsgl" });
});
</script>
