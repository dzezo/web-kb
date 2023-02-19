# Recoil

1. [Root](#root)
2. [Atom](#atom)
3. [Selector](#selector)
4. [seRecoilStateLoadable / useRecoilValueLoadable](#loadable)
5. [Selector Family](#selector-family)
6. [Atom Family](#atom-family)
7. [noWait(state)](#no-wait)
8. [waitForAll(dependencies)](#wait-for-all)
9. [waitForNone(dependencies)](#wait-for-none)

<div id="root">

## Root

How everything starts

```tsx
<RecoilRoot>
    <App />
</RecoilRoote>
```

<div id="atom">

## Atom

Atoms can be used in place of React local component state. If the same atom is used from multiple components, all those components share their state. Atoms need a unique key. This is how you define atom:

```tsx
const darkMode = atom({
  key: "darkModeState",
  default: false,
});

const [val, setVal] = useRecoilState(darkMode);
const val = useRecoilValue(darkMode);
const setVal = useSetRecoilState(darkMode);
```

#####Example TodoList:

```tsx
const todoListState = atom({
  key: "todoListState",
  default: [],
});

// To create new todo items, we need to access a setter function
function TodoItemCreator() {
  const setTodoList = useSetRecoilState(todoListState);

  // Notice we use the updater form of the setter function,
  // so that we can create a new todo list based on the old todo list.
  const addItem = () => {
    setTodoList((oldTodoList) => [
      ...oldTodoList,
      {
        id: getId(),
        text: inputValue,
        isComplete: false,
      },
    ]);
  };

  // utility for creating unique Id
  let id = 0;
  function getId() {
    return id++;
  }
}

function TodoItem({ item }) {
  const [todoList, setTodoList] = useRecoilState(todoListState);
  const index = todoList.findIndex((listItem) => listItem === item);

  const editItemText = ({ target: { value } }) => {
    const newList = replaceItemAtIndex(todoList, index, {
      ...item,
      text: value,
    });

    setTodoList(newList);
  };

  const toggleItemCompletion = () => {
    const newList = replaceItemAtIndex(todoList, index, {
      ...item,
      isComplete: !item.isComplete,
    });

    setTodoList(newList);
  };

  const deleteItem = () => {
    const newList = removeItemAtIndex(todoList, index);

    setTodoList(newList);
  };
}

function replaceItemAtIndex(arr, index, newValue) {
  return [...arr.slice(0, index), newValue, ...arr.slice(index + 1)];
}

function removeItemAtIndex(arr, index) {
  return [...arr.slice(0, index), ...arr.slice(index + 1)];
}
```

<div id="selector">

## Selector

A selector is a pure function that accepts **atoms or other selectors** as input. When these upstream atoms or selectors are updated, the selector function will be re-evaluated. Components can subscribe to selectors just like atoms, and will then be re-rendered when the selectors change.

Selectors are used to calculate derived data that is based on state. You can think of derived state as the output of passing state to a pure function that modifies the given state in some way. This lets us avoid redundant state. Selectors and atoms have the same interface and can therefore be substituted for one another.

The **get** property is the function that is to be computed. It can access the value of **atoms** and other **selectors** using the get argument passed to it. Whenever it accesses another atom or selector, a dependency is created such that updating the other atom or selector will cause this one to be recomputed.

```tsx
/**
  This selector is using fontSizeState atom and therefore has it as dependenc
  which means that it will get recomputed once atom changes
*/
const fontSizeLabelState = selector({
  key: 'fontSizeLabelState',
  get: ({get}) => {
    const fontSize = get(fontSizeState);
    const unit = 'px';

    return `${fontSize}${unit}`;
  },
});

function FontButton() {
  const [fontSize, setFontSize] = useRecoilState(fontSizeState);
  const fontSizeLabel = useRecoilValue(fontSizeLabelState);

  return (
    <>
      {/* Whenever we click button below and update fontSizeState this will
      reflect the change */}
      <div>Current font size: {fontSizeLabel}</div>

      <button onClick={() => setFontSize(fontSize + 1)} style={{fontSize}}>
        Click to Enlarge
      </button>
    </>
```

##### Example TodoList:

```tsx
const todoListFilterState = atom({
  key: "todoListFilterState",
  default: "Show All",
});

/** Using todoListFilterState and todoListState, we can build a 
    filteredTodoListState selector which derives a filtered list 
*/
const filteredTodoListState = selector({
  key: "filteredTodoListState",
  get: ({ get }) => {
    // derived state === passing state to a pure function
    // we can use get method to gain access to many atoms/selectors
    const filter = get(todoListFilterState);
    const list = get(todoListState);

    // side effect part
    switch (filter) {
      case "Show Completed":
        return list.filter((item) => item.isComplete);
      case "Show Uncompleted":
        return list.filter((item) => !item.isComplete);
      default:
        return list;
    }
  },
});

function TodoList() {
  // changed from todoListState to filteredTodoListState
  // this will display every todo because def val of atom is show all
  // and that will trigger default case
  const todoList = useRecoilValue(filteredTodoListState);

  return (
    <>
      {todoList.map((todoItem) => (
        <TodoItem item={todoItem} key={todoItem.id} />
      ))}
    </>
  );
}

/**
  In order to change the filter we just need to change filterState atom,
  and since it's a dependency of our selector it will trigger recomputation of
  filteredTodoListState selector and in turn it will display filtered list
*/
function TodoListFilters() {
  const [filter, setFilter] = useRecoilState(todoListFilterState);

  const updateFilter = ({ target: { value } }) => {
    setFilter(value);
  };

  return (
    <>
      Filter:
      <select value={filter} onChange={updateFilter}>
        <option value="Show All">All</option>
        <option value="Show Completed">Completed</option>
        <option value="Show Uncompleted">Uncompleted</option>
      </select>
    </>
  );
}
```

<div id="loadable">

## useRecoilStateLoadable / useRecoilValueLoadable

This hook is intended to be used for reading the value of asynchronous selectors. |This hook returns a **Loadable object for the value** along with the **setter callback.**

You can even use useRecoilValue/useRecoilState to read async selector but you need to wrap your whole component in **<React.Suspense>**

**_Loadable interface:_**
**state:** indicates the **status** of the selector. Possible values are **'hasValue', 'hasError', 'loading'**.
**contents:** If the state is **hasValue, it is the actual value**, if the state is **hasError it is the Error**.

Example of reading async selector:

```tsx
// Fetches some data from server
export const articleQuery = selector({
  key: "articleQuery",
  get: async () => {
    const articles = await ArticleService.getAll();
    return articles;
  },
});

const articles = useRecoilValueLoadable(articleQuery);

const renderArticles = () => {
  switch (articles.state) {
    case "hasValue":
      return articles.contents.map((article) => (
        <Article key={article.id} item={article} />
      ));
    case "loading":
    case "hasError":
    default:
      return <div>Loading...</div>;
  }
};

return <div className="ArticleList">{renderArticles()}</div>;
```

<div id="selector-family">

## Selector Family

A selectorFamily is a powerful pattern that is similar to a selector, but allows you to pass parameters to the get and set callbacks of a selector

##### Destructuring Example

```tsx
const formState = atom({
  key: "formState",
  default: {
    field1: "1",
    field2: "2",
    field3: "3",
  },
});

const formFieldState = selectorFamily({
  key: "FormField",
  get:
    (field) =>
    ({ get }) =>
      get(formState)[field],
  set:
    (field) =>
    ({ set }, newValue) =>
      set(formState, (prevState) => ({ ...prevState, [field]: newValue })),
});

const Component1 = () => {
  // parameter is passed when we decide to use selectorFamily
  const [value, onChange] = useRecoilState(formFieldState("field1"));
  return (
    <>
      {/* onChange will pass newValue to setter */}
      <input value={value} onChange={onChange} />
      <Component2 />
    </>
  );
};

const Component2 = () => {
  const [value, onChange] = useRecoilState(formFieldState("field2"));
  return <input value={value} onChange={onChange} />;
};
```

##### Async Query Example

```tsx
const articleByIdQuery = selectorFamily({
  key: "articleByIdQuery",
  get: (id) => async () => {
    const article = await ArticleService.getById(id);
    return article;
  },
});

// You call this like you would oridinary selector you just need to pass this
// added argument
const articles = useRecoilValueLoadable(articleByIdQuery(3));
```

<div id="atom-family">

## Atom Family

Let's say we have a canvas with some items on it. We would need to track state of that item so that we can display some values in let's say sidebar. We can do this by introducing Atom that would hold state of that item.

Now since there can be multiple items on a canvas we need to have multiple atoms that are different only in their id.

So lets say we have something like this:

```tsx
const CanvasItem = ({ id }) => {
    // now we need to fetch an atom by id
    const [itemState, setItemState] = useRecoilState(???)
    return;
}
```

so we need to define a function that takes id and returns atom

```tsx
id => atom({
    key: `item${id}`,
    default: {...},
})
```

and we need to memoize it in order to always get the same atom for same id

```tsx
memoize(id => atom(...))
```

and there is a utility in recoil that allows you to to this thing and it is called atomFamily

```tsx
atomFamily({
    key: 'item',
    default: id => {...}
})
```

so we can take this and export it as function:

```tsx
export const itemWithId = atomFamily(...)
```

now in order to get value it is expected to pass an id, because default getter is a function that requires id in order to return value, and we can write canvasItem code like this:

```tsx
const [itemState, setItemState] = useRecoilState(itemWithId(id));
```

You can wrap your state with function, in our example with atomFamily we can use selectorFamily to work with our atomFamily. Lets say that we want to introduce drag&drop functionalty where user can drop an image, and if our item is an image we want to set constant dimensions. In case like this we can do the following:

```tsx
export const itemWithId = selectorFamily({
  key: "item",
  get:
    (id) =>
    async ({ get }) => {
      const state = get(itemStateWithId(id));
      if (state.type === "image") {
        const dimensions = await dimensionsForImage(state.url);
        return {
          ...state,
          ...dimensions,
        };
      }

      return state;
    },
});
```

You can notice that our get function is returning a function that returns a value, so in turn we are returning a value, but with this we can have intermediate step where we can do our logic.

<div id="no-wait">

## noWait(state)

It is similar to useRecoilValueLoadable() except that it is a selector instead of a hook. so it can in turn be used by other Recoil selectors as well as hooks.

```tsx
const myQuery = selector({
  key: "MyQuery",
  get: ({ get }) => {
    // dbQuerySelector is async selector, we are wrapping it in noWait to extract
    // Loadable and return it as selector
    const loadable = get(noWait(dbQuerySelector));

    return {
      hasValue: { data: loadable.contents },
      hasError: { error: loadable.contents },
      loading: { data: "placeholder while loading" },
    }[loadable.state]; // gets recomputed on state change
  },
});
```

<div id="wait-for-all">

## waitForAll(dependencies)

A concurrency helper which allows us to concurrently evaluate multiple asynchronous dependencies. The dependencies may either be provided as a tuple array or as named dependencies in an object.

This to me looks like combineLatest from rxjs example below:

```ts
const customerInfoQuery = selectorFamily({
  key: "CustomerInfoQuery",
  get:
    (id) =>
    ({ get }) => {
      // dependencies provided as object {[key: string]: RecoilValue<>}
      const { info, invoices, payments } = get(
        waitForAll({
          // bunch of async selectors that we are waiting for
          info: customerInfoQuery(id),
          invoices: invoicesQuery(id),
          payments: paymentsQuery(id),
        })
      );

      return {
        name: info.name,
        transactions: [...invoices, ...payments],
      };
    },
});
```

Because the concurrency helper is provided as a selector, it may be used by Recoil hooks in a React component, as a dependency in a Recoil selector, or anywhere a Recoil state is used.

Example of providing async deps as an array

```ts
function FriendsInfo() {
  // because it's provided as a selector it can be used like this
  const [friendA, friendB] = useRecoilValue(
    waitForAll([friendAState, friendBState])
  );
  return (
    <div>
      Friend A Name: {friendA.name}
      Friend B Name: {friendB.name}
    </div>
  );
}
```

<div id="wait-for-none">

## waitForNone(dependencies)

This works like waitForAll except that it returns immediately and it returns a Loadable for each dependency. It is similar to noWait except that it allows requesting multiple dependencies at once.

This helper is useful for working with partial data or incrementally updating the UI as different data becomes available.
