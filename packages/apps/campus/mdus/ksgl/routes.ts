export default [
	{
		name: "ksglIndex",
		path: "/ksgl/",
		component: () => import("./views/Index/index.vue"),
		meta: {
			title: "ksglIndex",
			zhTitle: "考试管理",
			group: "教学管理",
			icon: "document",
			sort: 24
		}
	}
];
