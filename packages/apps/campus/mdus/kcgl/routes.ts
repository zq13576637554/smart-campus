export default [
	{
		name: "kcglIndex",
		path: "/kcgl/",
		component: () => import("./views/Index/index.vue"),
		meta: {
			title: "kcglIndex",
			zhTitle: "课程管理",
			group: "教学管理",
			icon: "course",
			sort: 20
		}
	}
];
