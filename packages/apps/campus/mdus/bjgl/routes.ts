export default [
	{
		name: "bjglIndex",
		path: "/bjgl/",
		component: () => import("./views/Index/index.vue"),
		meta: {
			title: "bjglIndex",
			zhTitle: "班级管理",
			group: "学籍管理",
			icon: "class",
			sort: 11
		}
	}
];
