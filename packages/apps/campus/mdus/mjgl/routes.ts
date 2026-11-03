export default [
	{
		name: "mjglIndex",
		path: "/mjgl/",
		component: () => import("./views/Index/index.vue"),
		meta: {
			title: "mjglIndex",
			zhTitle: "门禁安防",
			group: "校园生活",
			icon: "access",
			sort: 32
		}
	}
];
