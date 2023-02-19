import { defineConfig } from "tinacms";

// Your hosting provider likely exposes this as an environment variable
const branch = process.env.HEAD || process.env.VERCEL_GIT_COMMIT_REF || "main";

export default defineConfig({
	branch,
	clientId: "9e36169c-930b-4705-aa1f-0f9a874ca155", // Get this from tina.io
	token: "a073a1923e303a0f21b7cda29341bdec51b98463", // Get this from tina.io
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
