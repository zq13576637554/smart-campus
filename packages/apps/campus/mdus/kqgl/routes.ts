export default [
	{
		name: "kqglIndex",
		path: "/kqgl/",
		component: () => import("./views/Index/index.vue"),
		meta: {
			title: "kqglIndex",
			zhTitle: "智能考勤",
			group: "教学管理",
			icon: "attendance",
			sort: 23
		}
	}
];
