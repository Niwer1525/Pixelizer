import { BrowserWindow } from "electrobun/bun";

// Create the main application window
new BrowserWindow({
	title: "Pixelizer",
	url: "views://mainview/index.html",
	frame: {
		width: 1200,
		height: 800,
		x: 200,
		y: 200,
	},
});

console.log("Pixelizer started! You can start creating!");
