---
title: CRACO Storybook sagas continue
permalink: craco-shenanigans-part-2
date: "2022-07-29"
tags:
  - post-mortem
  - react
description:
  Using Create React App, Webpack 5, Storybook and React PDF raises some
  tricky dependency issues. Here's some tips for troubleshooting them, and the specific
  fix that work for me.
rss_only: false
---

One of the things that is tricky to plan for, and makes estimation impossible, is the unique ways various tools fail when you use them in a combination that might be uncommon.

I've written before about the difficulties you might face with using Create React App Config Override (CRACO) when it was causing some issues for me in a codebase using AntDesign: [Fixing AntD CSS Module Imports in Create React App with CRACO](/antd-craco-shenanigans "Fixing AntD CSS Module Imports in Create React App with CRACO").

I've also written about the difficulties I recently overcame using Create React App with the latest Webpack and Storybook: [Storybook Create React App Failure After Upgrade](/storybook-create-react-app-webpack-problems "Storybook Create React App Failure After Upgrade").

Today's issue was a strange overlap of both of these issues, with a third dependency thrown in for good measure!

## Scenario

React-PDF does not work properly with Webpack 5. Essentially, previous versions of webpack included some things the new one doesn't and you need to add them back in to your webpack config to sort things out. This is discussed very thoroughly in the issue thread: [Incompatible with Webpack 5 due to Buffer dependency](https://github.com/diegomura/react-pdf/issues/1029#).

**Complication #1** - the webpack config is not super easy to tinker with in a Create React App, so enter our old friend [CRACO](https://github.com/dilanx/craco "CRACO").

Adding this to the craco.config.js file gets things working well. It works in local development and it builds and deploys fine too.

```js
const webpack = require("webpack");

module.exports = {
	webpack: {
		configure: {
			resolve: {
				fallback: {
					process: require.resolve("process/browser.js"),
					zlib: require.resolve("browserify-zlib"),
					stream: require.resolve("stream-browserify"),
					util: require.resolve("util"),
					buffer: require.resolve("buffer"),
					asset: require.resolve("assert"),
				},
			},
			plugins: [
				new webpack.ProvidePlugin({
					Buffer: ["buffer", "Buffer"],
					process: "process/browser.js",
				}),
			],
		},
	},
};
```

**Complication #2** - Storybook doesn't use Craco for its builds, so it misses the webpack overrides. For us, this meant our Chromatic CI/CD pipeline was broken.

The problem here is that in a normal Create React App, you run `react-scripts` to kick off the dev server or run builds, and Storybook has a Create-React-App-Preset that knows what to do with that when you run Storybook builds. Unfortunately, to use CRACO, you replace `react-scripts` with `craco` and Storybook isn't configured to work with that.

There is a plugin for Storybook called [storybook-preset-craco](https://github.com/artisanofcode/storybook-preset-craco) but this didn't work for me, I think because this preset isn't compatible with Webpack 5! The great circle of life!

Instead, you can directly override the webpack config in the `.storybook/main.js` file:

```js
const path = require("path");
const webpack = require("webpack");

module.exports = {
	core: {
		builder: "webpack5",
	},
	stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
	addons: [
		"@storybook/preset-create-react-app",
		"@storybook/addon-links",
		"@storybook/addon-essentials",
		"@storybook/addon-a11y",
	],
	webpackFinal(config, { configType }) {
		return {
			...config,
			resolve: {
				...config.resolve,
				fallback: {
					...config.fallback,
					process: require.resolve("process/browser.js"),
					zlib: require.resolve("browserify-zlib"),
					stream: require.resolve("stream-browserify"),
					util: require.resolve("util"),
					buffer: require.resolve("buffer"),
					asset: require.resolve("assert"),
				},
			},
			plugins: [
				...config.plugins,
				new webpack.ProvidePlugin({
					Buffer: ["buffer", "Buffer"],
					process: "process/browser.js",
				}),
			],
		};
	},
};
```

The new addition here is everything in the `webpackFinal` function. This takes the existing webpack config as `config` and then appends the same fallbacks and plugins we defined to get React-PDF working in the CRACO config.

What you can see here is the webpack config being returned, but spread at various parts before having the additions appended to the various objects / arrays.

For example, each `...config` portion of the above means _'Include all the existing object values from the webpack config for this key'_, and then the part that follows is the portion of the CRACO config we need to get React-PDF working again.

It can be difficult to imagine what is happening here, but if you `console.log(config)`before the `return`, i.e.:

```js
...
webpackFinal(config, { configType }) {
  console.log(config);
  return {
      ...config,
...
```

and then run Storybook, you can actually see the whole webpack config printed to the terminal before the error messages, and it's easier to understand what your override is doing.

It's useful if the webpack config schema changes between versions in the future too...you might not be able to use my exact snippet to get yours working one day, but the method of seeing where to spread and append overrides will still be valid.

Anyway - I hope someone else finds this helpful! It's another of those issues where the exact answer isn't online because it's at the intersection of a number of tools all failing to work together in a very specific way.

Software Engineering is problem solving, sure. But it's mostly solving the problem of making various other solutions work in combination without creating new problems.
