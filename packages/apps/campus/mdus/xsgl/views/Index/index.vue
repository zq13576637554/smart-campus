<!-- 学生档案列表 -->
<template>
	<NPageBasic
		ref="pageRef"
		class="campus-xsgl-index"
		title="学生档案"
		row-key="id"
		:bars="_bars"
		:cols="_cols"
		:api="fetchData"
		:is-show-more-filter="true"
		:fixed-show-item-len="3"
		@selection-change="onSelectionChange"
		@on-tb-event-watch="onTbAction"
	>
		<template #handle-buttons>
			<ElButton v-auth:student:export type="info" plain @click="onExport">导出</ElButton>
			<ElButton v-auth:student:import type="info" plain @click="onImport">批量导入</ElButton>
			<ElButton v-auth:student:add type="primary" @click="toForm()">新增学生</ElButton>
		</template>
	</NPageBasic>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ElButton, ElMessageBox, ElMessage } from "lmLibs/element-plus";
import { useRouter } from "vue-router";
import NPageBasic from "lmCmpsBiz/NPageBasic";
import { useSimpleCols } from "lmHooks/tools/useCols";
import { $classOptionsGet, $studentDeletePost, $studentPagePost } from "lmApisCampus/api/academic";
import { sync } from "lmUtils/promise";
import { exportCsv } from "lmUtils/download";
import getCols from "./config/cols";
import getBars from "./config/bar";

const router = useRouter();
const pageRef = ref();
const selectRows = ref<any[]>([]);
const classOptions = ref<{ label: string; value: string }[]>([]);

const _cols = computed(() => getCols());
const _bars = computed(() => getBars(classOptions.value));

const fetchData = (params: Record<string, any>) => $studentPagePost(params);

const onSelectionChange = (rows: any[]) => (selectRows.value = rows);

const toForm = (row?: any) => {
	router.push({ path: "/xsgl/form/", query: row?.id ? { id: row.id } : {} });
};

const onDelete = async (row: any) => {
	const ok = await ElMessageBox.confirm(`确认删除学生「${row.name}」的档案吗？`, "删除确认", {
		type: "warning",
		confirmButtonText: "删除",
		cancelButtonText: "取消"
	}).catch(() => false);
	if (!ok) return;

	const [err] = await sync($studentDeletePost({ id: row.id }));
	if (!err) {
		ElMessage.success("删除成功");
		pageRef.value.doSearch(true, "search");
	}
};

const onExport = () => {
	const rows = selectRows.value.length ? selectRows.value : (pageRef.value?.getTbRef?.()?.getTableData?.() || []);
	exportCsv(
		rows,
		[
			{ label: "学号", prop: "studentNo" },
			{ label: "姓名", prop: "name" },
			{ label: "性别", prop: "gender" },
			{ label: "班级", prop: "className" },
			{ label: "状态", prop: "status" },
			{ label: "宿舍", prop: "dorm" },
			{ label: "联系电话", prop: "phone" }
		],
		"学生档案"
	);
	ElMessage.success(`已导出 ${rows.length} 条记录`);
};

const onImport = () => {
	router.push("/xsgl/import/");
};

const onTbAction = ({ key, data }: any) => {
	const row = data?.data?.row;
	if (key === "view") router.push({ path: "/xsgl/detail/", query: { id: row.id } });
	if (key === "edit") toForm(row);
	if (key === "delete") onDelete(row);
};

/* 班级下拉：供查询条件使用 */
(async () => {
	const [err, res] = await sync($classOptionsGet());
	if (!err) classOptions.value = res as any;
})();
</script>

<style lang="less">
.student-cell {
	display: flex;
	align-items: center;
	gap: 8px;

	&__avatar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		color: #fff;
		font-size: 12px;
		flex: 0 0 28px;
	}

	&__name {
		font-size: 13px;
		color: #1d2129;
	}

	&__no {
		font-size: 11px;
		color: #86909c;
	}
}
</style>
