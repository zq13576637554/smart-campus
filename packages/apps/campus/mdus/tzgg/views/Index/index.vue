<!-- 通知公告 -->
<template>
	<NPageBasic
		ref="pageRef"
		class="campus-tzgg-index"
		title="通知公告"
		row-key="id"
		:bars="bars"
		:cols="cols"
		:api="fetchData"
		:is-show-more-filter="true"
		@on-tb-event-watch="onTbAction"
	>
		<template #handle-buttons>
			<ElButton type="primary" @click="openForm()">发布通知</ElButton>
		</template>
	</NPageBasic>

	<Dialog v-model="dialogVisible" title="发布通知" :loading="submitting" width="680px" @ok="onSubmit">
		<Form ref="formRef" :items="formItems" :form-data="formData" :show-footer="false" label-width="90px" />
	</Dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElButton, ElMessage, ElMessageBox } from "lmLibs/element-plus";
import NPageBasic from "lmCmpsBiz/NPageBasic";
import Dialog from "lmCmpsBasic/Dialog";
import Form from "lmCmpsBasic/Form";
import type { FormItem } from "lmCmpsBasic/Form/types";
import { Input, Select } from "lmIreposF";
import { useSimpleCols } from "lmHooks/tools/useCols";
import { useSimpleBars } from "lmHooks/tools/useBars";
import { $noticeDeletePost, $noticePagePost, $noticeSavePost } from "lmApisCampus/api/system";
import { sync } from "lmUtils/promise";

const router = useRouter();
const pageRef = ref();
const formRef = ref();
const dialogVisible = ref(false);
const submitting = ref(false);

const bars = computed(() =>
	useSimpleBars([
		"标题|title|input",
		{
			bar: "类型|type|enum-type:NOTICE_TYPE",
			config: { itemValue: "" }
		},
		{
			bar: "发布时间|publishTime|date-type:daterange-startKey:startTime-endKey:endTime",
			config: { props: { format: "YYYY/MM/DD", valueFormat: "YYYY-MM-DD" } }
		}
	])
);

const cols = computed(() =>
	useSimpleCols([
		"idx",
		{
			col: "标题|title|text|minWidth:320-fixed:left",
			tdFn: (h: any, ctx: any) => {
				const { row } = ctx.data;
				return h("div", { class: "notice-cell" }, [
					row.top ? h("span", { class: "notice-cell__top" }, "置顶") : null,
					h(
						"a",
						{
							class: "ir-link",
							onClick: () => router.push({ path: "/tzgg/detail/", query: { id: row.id } })
						},
						row.title
					)
				]);
			}
		},
		{
			col: "类型|type|tag|minWidth:90",
			setComProps: { dictType: "NOTICE_TYPE" }
		},
		"发布人|publisher|minWidth:100",
		"发布时间|publishTime|minWidth:170",
		"阅读量|readCount|text|minWidth:100-format:number",
		{ col: "actions|查看:view-删除:delete", setComProps: { fixed: "right", minWidth: 120 } }
	])
);

const formItems: FormItem[] = [
	Input({
		label: "标题",
		prop: "title",
		colProps: { span: 24 },
		rules: [{ required: true, message: "请输入标题", trigger: "blur" }],
		yours: { placeholder: "请输入通知标题" }
	}),
	Select({ label: "类型", prop: "type", type: "enumSelect", dictType: "NOTICE_TYPE" }),
	Input({ label: "发布人", prop: "publisher", yours: { placeholder: "如 教务处" } }),
	Select({
		label: "是否置顶",
		prop: "top",
		options: [
			{ label: "置顶", value: true },
			{ label: "普通", value: false }
		]
	}),
	Input({
		label: "正文",
		prop: "content",
		type: "textarea",
		colProps: { span: 24 },
		rules: [{ required: true, message: "请输入正文", trigger: "blur" }],
		yours: { rows: 8, placeholder: "请输入通知正文" }
	})
];

const formData = reactive<Record<string, any>>({
	title: "",
	type: "NOTICE",
	publisher: "教务处",
	top: false,
	content: ""
});

const fetchData = (params: Record<string, any>) => $noticePagePost(params);

const openForm = () => {
	Object.assign(formData, { title: "", type: "NOTICE", publisher: "教务处", top: false, content: "" });
	dialogVisible.value = true;
};

const onSubmit = async () => {
	const valid = await formRef.value?.__validForm?.();
	if (!valid) return;
	submitting.value = true;
	try {
		const [err] = await sync($noticeSavePost({ ...formData }));
		if (err) return;
		ElMessage.success("发布成功");
		dialogVisible.value = false;
		pageRef.value.doSearch(false, "search");
	} finally {
		submitting.value = false;
	}
};

const onDelete = async (row: any) => {
	const ok = await ElMessageBox.confirm(`确认删除「${row.title}」吗？`, "删除确认", { type: "warning" }).catch(() => false);
	if (!ok) return;
	const [err] = await sync($noticeDeletePost({ id: row.id }));
	if (!err) {
		ElMessage.success("删除成功");
		pageRef.value.doSearch(true, "search");
	}
};

const onTbAction = ({ key, data }: any) => {
	const row = data?.data?.row;
	if (key === "view") router.push({ path: "/tzgg/detail/", query: { id: row.id } });
	if (key === "delete") onDelete(row);
};
</script>

<style lang="less">
.notice-cell {
	display: flex;
	align-items: center;
	gap: 6px;

	&__top {
		padding: 0 5px;
		border-radius: 3px;
		background: #ffeee8;
		color: #f53f3f;
		font-size: 11px;
		line-height: 16px;
	}
}
</style>
