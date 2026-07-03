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

			"src/mainview/js/api.js": "views/mainview/js/api.js",
			"src/mainview/js/board.js": "views/mainview/js/board.js",
			"src/mainview/js/main.js": "views/mainview/js/main.js",
			"src/mainview/js/theme.js": "views/mainview/js/theme.js",
			"src/mainview/js/ui-components.js": "views/mainview/js/ui-components.js",
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
