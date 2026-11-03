export default [
	{
		name: "xkzxIndex",
		path: "/xkzx/",
		component: () => import("./views/Index/index.vue"),
		meta: {
			title: "xkzxIndex",
			zhTitle: "选课中心",
			group: "教学管理",
			icon: "files",
			sort: 25
		}
	}
];
