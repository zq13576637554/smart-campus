export default [
	{
		name: "zctzIndex",
		path: "/zctz/",
		component: () => import("./views/Index/index.vue"),
		meta: {
			title: "zctzIndex",
			zhTitle: "资产台账",
			group: "系统设置",
			icon: "files",
			sort: 55
		}
	}
];
