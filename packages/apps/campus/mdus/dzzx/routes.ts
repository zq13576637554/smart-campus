export default [
	{
		name: "dzzxIndex",
		path: "/dzzx/",
		component: () => import("./views/Index/index.vue"),
		meta: {
			title: "dzzxIndex",
			zhTitle: "导入导出中心",
			group: "系统设置",
			icon: "files",
			sort: 56
		}
	},
	{
		name: "dzzxImport",
		path: "/dzzx/import/",
		component: () => import("./views/Import/index.vue"),
		meta: {
			title: "dzzxImport",
			zhTitle: "批量导入",
			group: "系统设置",
			icon: "files",
			sort: 57
		}
	}
];
