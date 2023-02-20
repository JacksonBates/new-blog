import { defineConfig } from "tinacms";

// Your hosting provider likely exposes this as an environment variable
const branch = process.env.HEAD || process.env.VERCEL_GIT_COMMIT_REF || "main";

export default defineConfig({
	branch,
	clientId: "9da4db14-fcf2-43ae-82a5-cc64832ea817", // Get this from tina.io
	token: "ca0ec9e26d745c5d9a0fb4850a178b0186e85ba4", // Get this from tina.io
	build: {
		outputFolder: "admin",
		publicFolder: "public",
	},
	media: {
		tina: {
			mediaRoot: "",
			publicFolder: "public",
		},
	},
	schema: {
		collections: [
			{
				name: "posts",
				label: "Posts",
				path: "content/blog",
				fields: [
					{
						type: "string",
						name: "title",
						label: "Title",
						isTitle: true,
						required: true,
					},
					{
						type: "datetime",
						name: "date",
						lable: "Date",
						required: false,
					},
					{
						type: "boolean",
						name: "rss_only",
						label: "RSS Only",
						required: false,
					},
					{
						type: "string",
						name: "tags",
						label: "Tags",
						list: true,
						required: false,
					},
					{
						type: "rich-text",
						name: "body",
						label: "Body",
						isBody: true,
					},
				],
			},
		],
	},
});
