export default [
	{
		name: "jsglIndex",
		path: "/jsgl/",
		component: () => import("./views/Index/index.vue"),
		meta: {
			title: "jsglIndex",
			zhTitle: "教职工管理",
			group: "学籍管理",
			icon: "teacher",
			sort: 12
		}
	}
];
