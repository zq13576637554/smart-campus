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
	}
];
