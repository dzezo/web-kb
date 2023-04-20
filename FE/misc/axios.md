## Setting up axios

```js
import axios from "axios";

export default axios.create({
  baseURL: "http://localhost:3500",
});
```

#### GET

```js
const fetchPosts = async () => {
  try {
    const response = await api.get("/posts");
    setPosts(response.data);
  } catch (err) {
    if (err.response) {
      // Not in the 200 response range
      console.log(err.response.data);
      console.log(err.response.status);
      console.log(err.response.headers);
    } else {
      console.log(`Error: ${err.message}`);
    }
  }
};
```

One interesting thing about axios is that it's going to throw error if responses are not in 200 range. Some properties of response object are

- response.data
- response.status
- response.headers

If there is some unknown error you can check if `err.response` even exists

#### POST

```js
const response = await api.post("/posts", newPost);
```

#### DELETE

```js
await api.delete(`/posts/${id}`);
```

#### PUT

```js
const response = await api.put(`/posts/${id}`, updatedPost);
```

## Simultaneous data

`axios.all` can execute multiple requests at once and once all requests are fullfiled then we are going to get our response and handle it.

```js
const response = await axios.all([
  axios.get("https://jsonplaceholder.typicode.com/todos"),
  axios.get("https://jsonplaceholder.typicode.com/posts"),
]);
```

response of this function is similar to what you would get in combineLatest from RxJS lib, meaning that return will be an array of responses. In our case from above first response is going to be todos and second posts

```js
console.log(response[0].data); // Todos data
console.log(response[1].data); // Posts data
```

so with that in mind you can destructure that array into something meaningfull or use `axios.spread()` function in conjuction with _Promise.then_ structure

```js
const [todos, posts] = await axios.all(...);
```

## INTERCEPTORS (YOU CAN USE BOTH REQUEST AND RESPONSE)

In example bellow we defined interceptor for outgoing requests. You can define your error interceptor with response instead of request

```js
axios.interceptors.request.use(
  (config) => {
    console.log(`${config.method.toUpperCase()} request sent to ${config.url}`);

    // You can say something like if url does not contain auth in it
    // or maybe if user is logged in
    // Then change config headers to have Authorization token set

    return config;
  },
  (err) => {
    return Promise.reject(error);
  }
);
```

## CUSTOM HEADERS (Auth tokens)

```js
const config = {
  headers: {
    "Content-Type": "application/json",
    Authorization: "some jwt token",
  },
};
const res = await axios.post("https://localhost:5000/todos", data, config);
```

## TRANSFORM REQUESTS & RESPONSES

Axios allows you to transform request/response data on the fly

```js
const options = {
	method: 'post',
	url: 'https://jsonplaceholder.typicode.com/todos'
	data: { title: 'Hello World' },
	transformResponse: axios.defaults.transformResponse.concat(data => {
		data.title = data.title.toUpperCase();
		data.createdAt = new Date(data.createdAt);
		return data;
	})
};

const res = await axios(options);
```

## GLOBALS

With globals you can send headers with any request that you send. This comes handy when you are dealing with Auth Tokens

```js
axios.defaults.headers.common["Authorization"] = "some jwt token";
```

This eliminates the need to declare interceptors for headers and also eliminates the need to make custom header for every protected route

## Error Handling

```js
try {
	const res = await axios.get(...);
} catch (err) {
	if (err.response) {
		// Server responded with status other than 200 range
	}
	else if (err.request) {
		// Request was made but server did not respond
	}
	else {
		// Unknown error
	}
}
```

## CANCEL TOKEN

Cancels requests on the fly

```js
const src = axios.CancelToken.source();

axios
  .get("some url", { cancelToken: src.token })
  .then((res) => console.log(res.data))
  .catch((thrown) => {
    if (axios.isCancel(thrown)) console.log("Request canceled", thrown.message);
  });

if (true) src.cancel("Request cancel"); // This will cancel sent request
```

## AXIOS INSTANCES

```js
const axiosInstance = axios.create({
  baseURL: "https://jsonplaceholder.typicode.com",
});

axiosInstance.get("/comments");
```

## TIMEOUTS

You can define request timeouts, after which request will stop. They are in miliseconds

```js
const res = await axios.get("some_url", { timeout: 5000 });
```
