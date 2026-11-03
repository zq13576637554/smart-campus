export default [
	{
		name: "cjglIndex",
		path: "/cjgl/",
		component: () => import("./views/Index/index.vue"),
		meta: {
			title: "cjglIndex",
			zhTitle: "学业成绩",
			group: "教学管理",
			icon: "score",
			sort: 22
		}
	}
];
