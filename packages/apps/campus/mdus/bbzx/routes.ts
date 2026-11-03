export default [
	{
		name: "bbzxIndex",
		path: "/bbzx/",
		component: () => import("./views/Index/index.vue"),
		meta: {
			title: "bbzxIndex",
			zhTitle: "报表中心",
			group: "智能中枢",
			icon: "document",
			sort: 43
		}
	}
];
