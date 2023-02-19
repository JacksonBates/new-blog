---
title: The Case of the Missing File
permalink: no-react-file-post-data
date: "2022-08-03"
description:
  Confusingly, my React app was not accepting file uploads and posting
  them as expected. The problem lay in improper fetch abstractions.
rss_only: false
---

It shouldn't take 2 days to figure out how to upload a file using React.

## TL;DR

Don't mess with your fetch requests unless you really know what you're doing.

## The scenario

A file upload input in a single page react app was reporting that a file had been selected, but posting the content had no effect.

Specifically, the Grommet FileInput component was showing the file, but the post request was not posting it.

'React' is a bit of a red-herring here. The issue wasn't with React at all, in the end.

Unfortunately, as with most of software development, half the trick is discerning the red-herrings from the real deal.

In this instance I was using a combination of Grommet and Formik to handle the file upload, initially. So ruling out Grommet FileInputs, and Formik value handling, and of course, both of those in combination, was the first challenge.

## Diagnosis

In order to truly understand the problem, I boiled everything down to it's simplest elements:

```js
<form onSubmit={handleSubmit}>
	<label htmlFor="file">File Upload: </label>
	<input type="file" name="file" id="file" onChange={handleFile} />
	<button type="submit">Submit</button>
</form>
```

The `handleFile` function simply takes the file from `event.target.files[0]` and writes it to some state.

The `handleSubmit` function instantiates some `new FormData()` and adds the file to it. Then it POSTs it. Except, it never posted it.

## Understanding the problem

Sending file data has some requirements in order to work.

Firstly, it should be correctly form encoded.

Simply adding it to `FormData` should be sufficient for this, for example:

```js
function handleSubmit(event) {
	const formData = new FormData();
	formData.set("file", event.target.files[0]);
}
```

This will automatically create the appropriate form boundary to be parsed by `multipart/form-data`.

The potential issue you might face is in your POST request headers.

It is crucial - absolutely critical - that you do not add a `Content-Type` header of your own in your fetch / axios header config. Doing so overwrites the form's attempt to set it with boundaries for you.

This was my first mistake - I'll show the culprit below later.

Secondly, you need to ensure you aren't altering the POST request body.

This was my second mistake.

How did I make these two mistakes?

By being clever!

The React codebase I was working on is a Single Page App, that communicates with a Laravel API server.

Most API requests require an authentication token, and all POST requests, until now, only needed to send stringified JSON to the API for processing.

So, I wrote a clever fetchWrapper to be used in some API custom hooks, so that handling the authentication token and the JSON stuff could be abstracted away.

The original fetchWrapper looked a bit like this:

```js
async function fetchWrapper(
  { endpoint = "", method = "GET", data = {} },
  authToken = null,
) {
  const config = {
    method,
    headers: {
      Accept: "application/json",
      Content-Type: "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  };


  if (method === "POST" || method === "PUT") {
    config.body = JSON.stringify(data);
  }

  return fetch(`${apiEndpoint}${endpoint}`, config).then((response) => {
    if (!response.ok) {
      return response
        .json()
        .catch(() => {
          // Couldn't parse the JSON
          throw new Error(response.status);
        })
        .then(({ message }) => {
          if (message === "Token has expired") {
            refreshToken(authToken);
          }
          // Got valid JSON with error response, use it
          throw new Error(message || response.status);
        });
    }
    // Successful response, parse the JSON and return the data
    return response.json();
  });
}
```

There's a bit more to it than that, but you can see why this is useful. It handles authentication via the Bearer token. It sets consistent headers. It even handles refreshing authentication tokens when the JWT_TTL has expired so API requests can continue without missing a beat.

You may also have noticed it breaks the two rules we have for sending coherent file data via forms - it sets the Content-Type header to `application/json` and stringifies the JSON for all POST and PUT bodies.

## Solution

How to solve this elegantly can be left as an exercise to the reader.

But my quick solution today to verify the issue was to add an additional optional parameter to my custom useApi post hook to designate whether a file needed to be sent, and then to use that to control the fetch header and body accordingly.

For example:

```js
export function useAPI() {
  const { authToken } = useAuth();

  return {
    post: (endpoint = "", data = {}, file = false) =>
      fetchWrapper({ endpoint, method: "POST", data }, authToken, file),
}

async function fetchWrapper(
  { endpoint = "", method = "GET", data = {} },
  authToken = null,
  file = false
) {
  const config = {
    method,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  };

  if (!file) config.headers["Content-Type"] = "application/json";

  if (method === "POST" || method === "PUT") {
    if (file) {
      config.body = data;
    } else {
      config.body = JSON.stringify(data);
    }
  }
  [...and so on...]
```

So now, my `handleSubmit` function can call:

```js
post("/api/endpoint", formData, true);
```

and it will configure the fetch request under the hood appropriately.

Hopefully, this helps some other wayward fool that got too clever with their own fetch abstractions.
