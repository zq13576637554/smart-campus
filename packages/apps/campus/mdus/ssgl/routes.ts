export default [
	{
		name: "ssglIndex",
		path: "/ssgl/",
		component: () => import("./views/Index/index.vue"),
		meta: {
			title: "ssglIndex",
			zhTitle: "智慧宿舍",
			group: "校园生活",
			icon: "dorm",
			sort: 30
		}
	}
];
