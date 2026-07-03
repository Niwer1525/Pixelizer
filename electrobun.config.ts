import type { ElectrobunConfig } from "electrobun";

export default {
	app: {
		name: "pixelizer",
		identifier: "niwer.pixelizer",
		version: "1.0.0",
	},
	build: {
		views: {
			mainview: {
				entrypoint: "src/mainview/index.ts",
			},
		},
		copy: {
			"src/mainview/index.html": "views/mainview/index.html",
			"src/mainview/style.css": "views/mainview/style.css",
			"src/mainview/main.js": "views/mainview/main.js",
		},
		mac: {
			bundleCEF: false,
		},
		linux: {
			bundleCEF: false,
		},
		win: {
			bundleCEF: false,
		},
	},
} satisfies ElectrobunConfig;
