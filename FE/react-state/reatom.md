# Reatom

1. [@reatom/core](#re-core)
2. [@reatom/react](#re-react)

### @reatom/core

<div id="re-core">

##### Action

Declared action is a function that accepts payload as the first argument and returns object with shape: **{ type, payload }.**

```ts
const add = declareAction();

console.log(add(123));
// { type: 'action #1', payload: 123 }
```

Think of it as your own implementation of action handler in angular. Instead of having your action be a string let's say **{ type: "ADD" }** you can just declare it as an action and it will populate your payload part if you provide an argument.

Now in order to use this you need to dispatch this action on store (global context) when you do so this action will find it's reducer and execute it.

```ts
import { declareAction } from "@reatom/core";

const increment = declareAction();

// usage
store.dispatch(increment());
```

##### Atom

Two things are important about atoms, one is it's state and second is it's reducers.

Atom reducers **may depend** on **declared action** or **other atoms** and must be pure functions that return new immutable version of the state.
If a reducer returns old state – depended atoms and subscribers will not be triggered.

```ts
// Anatomy of Atom
const increment = declareAction();
const add = declareAction();
const countAtom = declareAtom(
  // name (optional!)
  "count",
  // initial state
  0,
  // reducers
  (on) => [
    // reducers definitions:
    // `on('declared action or declared atom', reducer)`
    // reducer: (oldState, payload) => newState

    on(increment, (state) => state + 1),
    on(add, (state, payload) => state + payload),
  ]
);
```

Atom never has it own state, only store contains states of all known atoms. How store can know about atoms - two ways:

1. you passing **combine** of **all needed atoms** as argument to createStore;
2. create **subscription** to atom.

_In first way, passed atom and dependencies of it create states that **will live in store forever** and you can always get it by **store.getState(myAtom)**._

_In second way, subscription to atom creating a temporal state to atom and its dependencies in store, that'll be deleted after all dependents unsubscribe._

#### Example of usage

Putting everything together:

```ts
import {
  declareAction,
  declareAtom,
  map,
  combine,
  createStore,
} from "@reatom/core";

/**
 * Step 1.
 * Declare actions
 */
const increment = declareAction();

/**
 * Step 2.
 * Declare atoms (like reducers or models)
 */
const counterAtom = declareAtom(0, (on) => [
  on(increment, (state) => state + 1),
]);

// const countDoubledAtom = declareAtom(0, (on) => [
//   reducers definitions:
//   `on('depended declared action or atom', reducer)`
//   `reducer: (oldState, dependedValues) => newState`
//
//   on(counterAtom, (state, count) => count * 2),
// ]);
// shortcut:
const counterDoubledAtom = map(counterAtom, (value) => value * 2);

// creates new separate atom that contains state of both atoms
const countersShapeAtom = combine({
  counter: counterAtom,
  counterDoubled: counterDoubledAtom,
});

/**
 * Step 3.
 * Create store entry point
 */
const store = createStore(countersShapeAtom);

/**
 * Step 4.
 * Dispatch action
 */
store.dispatch(increment());

/**
 * Step 5.
 * Get action results
 */
console.log(store.getState(counterAtom));
// ➜ 1

console.log(store.getState(counterDoubledAtom));
// ➜ 2

console.log(store.getState(countersShapeAtom));
// ➜ { counter: 1, counterDoubled: 2 }
```

### @reatom/react

<div id="re-react">

#### Hooks api

##### useAtom

Connects the atom to the store provided in context and returns the state of the atom from the store (or default atom state).

```ts
const atomValue = useAtom(atom);

// Retrieve atom state and apply dynamic selector
const atomValue = useAtom(atom, (atomState) => atomState[props.id], [props.id]);
/**
NOTE. You need to pass a third argument to useAtom that is the array of values 
that the atom depends on. To make sure the state selector is reapplied and derived
value is recalculated when dependencies change.
*/
```

##### useAction

Binds action with dispatch to the store provided in the context

```ts
// Basic
const handleDoSome = useAction(doSome);

// Prepare payload for dispatch
const handleDoSome = useAction(
  (value) =>
    doSome({
      id: props.id,
      value,
    }),
  [props.id]
);

// Conditional dispatch
const handleDoSome = useAction((payload) => {
  if (condition) return doSome(payload);
}, []);
```

#### Usage

##### Step 1. Create store

```tsx
// App
import React from "react";
import { createStore } from "@reatom/core";
import { context } from "@reatom/react";
import { Form } from "./components/Form";

export const App = () => {
  // create stateful context for atoms execution
  const store = createStore();

  return (
    <div className="App">
      <context.Provider value={store}>
        <Form />
      </context.Provider>
    </div>
  );
};
```

##### Step 2. Use in components

```tsx
// components/Form
import { declareAction, declareAtom } from "@reatom/core";
import { useAction, useAtom } from "@reatom/react";

const changeName = declareAction();
const nameAtom = declareAtom("", (on) => [
  on(changeName, (state, payload) => payload),
]);

export const Form = () => {
  const name = useAtom(nameAtom);
  const handleChangeName = useAction((e) => changeName(e.target.value));

  return (
    <form>
      <label htmlFor="name">Enter your name</label>
      <input id="name" value={name} onChange={handleChangeName} />
    </form>
  );
};
```
