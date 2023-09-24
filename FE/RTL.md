# React Testing Library and Jest

| Library                     | Purpose                                                |
| :-------------------------- | :----------------------------------------------------- |
| @testing-library/react      | Uses ReactDom to render a component for testing        |
| @testing-library/user-event | Helps simulate user input like typing and clicking     |
| @testing-library/dom        | Helps find element that are rendered by our components |
| jest                        | Runs our tests, reports results                        |
| jsdom                       | Simulates browser when running in a Node environment   |

### Simulating user events

Two most important functions from `@testing-library/user-event` are:

- `user.click(element)` - Simulating clicking on element
- `user.keyboard('asdf')` - Simulates typing 'asdf'
- `user.keyboard('{Enter}')` - Simulate pressing Enter key

### Mock functions

- In English, _mock_ can mean _not real_
- Fake function that doesn't do anything
- Records whenever it gets called, and the arguments it was called with
- Used very often when we need to make sura a component calls a callback

```jsx
const mock = jest.fn(); // This is how we create mock function in jest

render(<Component callback={mock} />);

expect(mock).toHaveBeenCalled();
expect(mock).toHaveBeenCalledWith({ name: "John" });
```

### Query functions

Query functions help us find elements that are rendered by our component. Memorizing all the query functions to find elements + roles is hard. To get help with finding a particular element, use this helper function:

```js
screen.logTestingPlaygroundURL();
```

Takes the HTML currently rendered by your component and creates a link to view that HTML in _Testing Playground_ tool. Testing Playground help you write queries.

#### Query functions fallbacks

Sometimes finding elements by role just doesn't work well, There are two fallback ways to find elements when preferred _role_ approach doesn't work:

1. data-testid
2. container.querySelector()

##### data-testid

```html
<!-- It's important for data attribute to be exactly data-testid -->
<tbody data-testid="users"></tbody>
```

```js
import { render, screen, within } from "@testing-library/react";

const rows = within(screen.getByTestId("users")).getAllByRole("row");
```

##### container.querySelector()

```jsx
// Whenever RTS renders our component it wraps it in additional <div> element.
// This <div> is reffered to as container.
// You can inspect this in Testing Playground tool.
const { container } = render(<Component />);

// eslint-disable-next-line
const rows = container.querySelectorAll("tbody tr");
```

## Understanding Element Roles

You can find elements by role using `screen.getByRole(role)`, some common elements and their roles:

| Element          | Role        |
| :--------------- | :---------- |
| a                | Link        |
| button           | Button      |
| header           | Banner      |
| footer           | Contentinfo |
| h1               | Heading     |
| img              | Img         |
| li               | Listitem    |
| ul               | ListGroup   |
| input (checkbox) | Checkbox    |
| input (number)   | Spinbutton  |
| input (radio)    | Radio       |
| input (text)     | Textbox     |

**Q:** How can you find element if there are two elements with the exact same role?
**A:** One possible way of doing this is using accessible name. Accessible name of an element is text within it.

```jsx
<button>Submit</button>}
```

```js
const submitButton = screen.getByRole("button", {
  name: /submit/i, // You can use string or regex
});
```

**Q:** But what about elements that don't have accessible name, like inputs?
**A:** You can add label to them

```jsx
<label htmlFor="email">Email</label>
<input id="email" />
<button aria-label="sign in">
  <svg />
</button>}
```

```js
const emailButton = screen.getByRole("textbox", {
  name: /email/i, // You can use string or regex
});
const signInButton = screen.getByRole("textbox", {
  name: /sign in/i, // You can use string or regex
});
```

## Query functions

All query functions are accessed through the `screen` object in a test. These query functions always begin with one of the following names:

- getBy
- getAllBy
- queryBy
- queryAllBy
- findBy
- findAllBy

These names indicate the following:

1. Whether the function will return an element or array of elements
2. What happens if the function find 0, 1 or more then 1 element
3. Whether the function runs instantly (sync) or looks for an element over a span of time (async)

| Name      | 0     | 1         | >1        | Async | Use                                 |
| :-------- | ----- | --------- | --------- | ----- | ----------------------------------- |
| getBy     | Throw | Element   | Throw     |       | prove element exist                 |
| getAllBy  | Throw | Element[] | Element[] |       | prove elements exist                |
| queryBy   | null  | Element   | Throw     |       | prove elements doesn't exist        |
| queryAll  | []    | Element[] | Element[] |       | prove elements don't exist          |
| findBy    | Throw | Element   | Throw     | true  | make sure element eventually exist  |
| findAllBy | Throw | Element[] | Element[] | true  | make sure elements eventually exist |

```jsx
test("favor getBy to prove element exists", () => {
  render(<Component />);

  const element = screen.getByRole("list");

  expect(element).toBeInTheDocument();
});
```

You might be wondering why do we need expect statment, if it's not found in document `getByRole` will throw an error and test will fail like it should, so we can write it like this:

```jsx
test("favor getBy to prove element exists", () => {
  render(<Component />);

  screen.getByRole("list");
});
```

This will work correctly but situation may come in which someone changes query function and test passes when it shouldn't because test is vaguely written

## Query functions suffixes

RTL provides many different query functions. Each begins with name like getBy, findBy, etc. The names also have common endings. The different name endings indicate how the query for an element will be performed

| End of Function Name | Search Criteria                        |
| :------------------- | -------------------------------------- |
| ByRole               | find by implicit or explict ARIA role  |
| ByLabelText          | find by text contained in paired label |
| ByPlaceholderText    | find by placeholder text               |
| ByText               | find by text                           |
| ByDisplayValue       | find by current value                  |
| ByAltText            | find by alt attribute                  |
| ByTitle              | find by title attribute                |
| ByTestId             | find by data-testid                    |

## Matchers in Jest

Matchers help make sure that a value is what we expect it to be.

```jsx
const form = screen.getByRole("form");
const buttons = within(form).getByRole("button");

expect(buttons).toHaveLength(2);
```

If we have to do same process over and over again, we have option of creating custom matcher, example of custom matcher for previous example:

```jsx
const form = screen.getByRole("form");

expect(buttons).toContainRole("button", 2);
```

Implementation of this custom matcher:

```js
function toContainRole(container, role, qty = 1) {
  const elements = within(container).queryAllByRole(role);

  if (elements.length === qty) {
    return { pass: true };
  }

  return {
    pass: false;
    message: () => `Expected to find ${qty} ${role} elements. Found ${elements.length} instead`
  }
}

// registering custom matcher
expect.extend({ toContainRole })
```

## act() Warnings

To better undestand act warning there are 4 topics we need to cover:

1. Unexpected state updates in tests are bad
2. The act function defines a window in time where state updates can (and should) occur
3. React Testing Library uses `act` behind the scenes for you!
4. To solve act warnings, you should use a `findBy`. Usually you don't want to follow the advice of the warning

### Unexpected state updates in tests

Simple component loads data on button click.

```jsx
function UsersList() {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (shouldLoad) fetchUsers().then(setUsers);
  });

  return (
    <button onClick={() => setShouldLoad(true)}>
      Load
    </button>
    <ul>
      {users.map((user) => <li key={user.id}>{user.name}</li>)}
    </ul>
  )
}
```

Test around for that component

```jsx
test("Clicking on the button loads users", () => {
  render(<UsersList />);

  const button = screen.getByRole("button");
  user.click(button);

  const users = screen.getAllByRole("listitem");
  expect(users).toHaveLength(3);
});
```

When button gets clicked data requests is going to happen, and after some time request is going to finish and state will update. When state gets updated users are going to get rendered.

Problem with this test is that it is going to try and find users right away, and it will fail.

### act Function

Is implemented by ReactDOM and defines a window in time where state updates can and should occur. This is how test written without RTL would look like

```jsx
import { render } from 'react-dom';
import { act } from 'react-dom/test-utils';

test('clicking the button loads users', () => {
  act(() => render(<UsersList />, container));

  const button = document.querySelector('button');
  await act(async () => button.dispatch(new MouseEvent('click')));

  const users = document.querySelectorAll('li');
  expect(users).toHaveLength(3);
})
```

Inside a function that we pass to `act`, we can either:

1. render a component
2. have some code that will change state

So if we are not using RTL and want to do something that will change state we need to wrap that in `act`.
This works because React will process all state updates + useEffects before exiting `act`. That's why it defines window in time where changes could and should occur.

### RTL uses act

All things that can induce state changes are calling act behind the scenes. Things like:

- screen.findBy
- screen.findAllBy
- waitFor
- user.keyboard
- user.click

This is the reason why you should avoid using `act` in your tests.

## Module mocks

Sometimes we could get act warning because of some nested component. If rendering of this component is not crucial we can mock it (not really render it).

```jsx
jest.mock("../tree/FileIcon", () => {
  // Content of FileIcon.js
  return () => {
    return "File Icon Component";
  };
});
```

We can use `jest.mock` to fake content of another file. When we specify `"../tree/FileIcon"` that means don't really import this file, instead if anyone tries to import this file just give them this code:

```js
() => {
  return "File Icon Component";
};
```

## Data Fetching in Tests

- We don't want our components to make actual network requests
- Slow! Data might change!
- We fake (or mock) data fetching in tests

### Options for Data Fetching

- Mock the file that contains the data fetching code
  - `jest.mock`
- Use a library to 'mock' axios - get axios to return fake data
  - instead of reaching to API we can use `msw` (Mock Service Worker)
  - `msw` intercepts request and respond to it
- Create manual mock for axios

## MSW (Mock Service Worker)

MSW Setup

1. Create a test file
2. Understand the exact URL, method, and return value of requests that your component will make
3. Create a MSW handler to intercept that request and return some fake data for your component to use
4. Set up the beforeAll, afterEach and afterAll hooks in your test file
5. In a test, render the component. Wait for an element to be visible.

Example of creating MSW handler to intercept network request

```js
import { setupServer } from "msw/node";
import { rest } from "msw";

const getRepos = rest.get("/api/repositories", (req, res, ctx) => {
  const lang = req.url.searchParams.get("q").split("language:")[1];
  const fakeData = {
    items: [
      { id: 1, full_name: `${lang}_one` },
      { id: 1, full_name: `${lang}_two` },
    ],
  };

  return res(ctx.json(fakeData));
});

const handler = [getRepos];
const server = setupServer(...handlers); // Sets up requests inteceptions using the given handlers.

// Then you would need to setup jest hooks to control this server

// Runs one time before all tests inside this file
beforeAll(() => server.listen()); // Start the server (which listens)
// Runs after each test is executed, regardless whether it failed or not.
afterEach(() => server.resetHandlers()); // Resets handlers to default state (if needed)
// Runs after all tests inside this file are executed
afterAll(() => server.close()); // Stops the server (stops listening)
```

This is example of reusable create server function:

```js
// test/server.js
import { setupServer } from "msw/node";
import { rest } from "msw";

export function createServer(handlerConfig) {
  const handlers = handlerConfig.map((config) => {
    return rest[config.method || "get"](config.path, (req, res, ctx) => {
      const result = config.res(req, res, ctx);
      return res(ctx.json(result));
    });
  });

  const server = setupServer(...handlers);
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
}
```

### Test scoping

Lets say that you want to test component behaviour on different request responses

```js
createServer([
  {
    path: "/api/user",
    res: () => ({ user: null }),
  },
]);

test("logged out: sign in and sign up are visible", async () => {
  // Some assertions
});
test("logged out: sign out is not visible", async () => {
  // Some assertions
});

createServer([
  {
    path: "/api/user",
    res: () => ({ user: { id: 1, email: "test@test.com" } }),
  },
]);

test("logged in: sign in and sign up are not visible", async () => {
  // Some assertions
});
test("logged in: sign out is visible", async () => {
  // Some assertions
});
```

This seems fine, mocking request to return data for _logged out_ scenario before running test cases, and then re-creating mock server for _logged in_ cases.

This has one flaw it assumes that jest will execute this in order! Jest will skip `test` until test suite is established.

This means that tests will be executed last, things like Jest hooks (beforeAll, afterAll, ...) need to be setup before testing begins.

Luckily there is a way around this problem using `describe`. This allows you to scope you test cases and Jest hooks, which is perfect for what we need. Reworked example:

```js
describe("logged out", () => {
  createServer([
    {
      path: "/api/user",
      res: () => ({ user: null }),
    },
  ]);

  test("sign in and sign up are visible", async () => {
    // Some assertions
  });
  test("sign out is not visible", async () => {
    // Some assertions
  });
});

describe("logged in", () => {
  createServer([
    {
      path: "/api/user",
      res: () => ({ user: { id: 1, email: "test@test.com" } }),
    },
  ]);

  test("sign in and sign up are not visible", async () => {
    // Some assertions
  });
  test("sign out is visible", async () => {
    // Some assertions
  });
});
```

`describe` takes description string as first argument, notice that _"logged out"_ and _"logged in"_ got moved there from `test`

## Debugging Tests

1. Use `test.only` or `describe.only` to limit the number of tests executed
2. Set up a debugger
   - Add the following script to package.json: `react-scripts --inspect-brk test --runInBand --no-cache`
   - Add a `debugger` statement somewhere in your tests or component
   - Use a `test.only` or `describe.only` to limit tests
   - Run the above script command
   - Navigate to **about:inspect** in your browser
3. Classic `console.log()`
