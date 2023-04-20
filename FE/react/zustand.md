# Zustand

1. [Store](#store)
2. [Memoizing selectors](#memoizing-selectors)
3. [Overwriting state](#overwriting-state)
4. [Async actions](#async-actions)
5. [Read from state in actions](#read-state-from-actions)
6. [Reading/Writing and Reacting to Changes outside of components](#rw-outside)
7. [Persist middleware](#persist)
8. [Persist API](#persist-api)
9. [Spliting Store](#store-split)
10. [Nested Objects](#nested-objects)

<div id="store">

## Store

Your store is a hook! Use the hook anywhere, no providers needed. Select your state and the component will re-render on changes.

```tsx
import create from "zustand";

// set is function used to merge state
const useStore = create((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
}));

const BearCounter = () => {
  const bears = useStore((state) => state.bears);
  return <h1>{bears} around here ...</h1>;
};

const Controls = () => {
  const increasePopulation = useStore((state) => state.increasePopulation);
  return <button onClick={increasePopulation}>one up</button>;
};
```

You can fetch everything by using **useStore()**, but bear in mind that it will cause the component to update on every state change!

Instead of that you can select state slices, like in example below:

```tsx
// fetch everything
const state = useStore();

// Single state pick
const nuts = useStore((state) => state.nuts);
const honey = useStore((state) => state.honey);

// Multiple state pick

// Object pick
const { nuts, honey } = useStore((state) => ({
  nuts: state.nuts,
  honey: state.honey,
}));

// Array pick
const [nuts, honey] = useStore((state) => [state.nuts, state.honey]);

// Mapped picks
const treats = useStore((state) => Object.keys(state.treats));
```

Second argument of useStore hook is equality function which is used to detect changes and cause re-rendering you can use your own custom function for better control over re-rendering.

By default it detects changes using strict-equality (old === new)

```ts
const treats = useStore(
  (state) => state.treats,
  (oldTreats, newTreats) => compare(oldTreats, newTreats) // custom compare
);
```

<div id="memoizing-selectors">

#### Memoizing selectors

It is generally recommended to memoize selectors with useCallback. This will prevent unnecessary computations each render.

```ts
const fruit = useStore(useCallback((state) => state.fruits[id], [id]));
```

You can define your selector outside of component if it does not depend on scope, in that manner you can avoid using useCallback.

```ts
const selector = (state) => state.berries;

function Component() {
  const berries = useStore(selector);
}
```

<div id="overwriting-state">

#### Overwriting state

Set function has a 2nd arg which is false be default. If you set it to true it will replace **state model** instead of merging

```ts
import omit from "lodash-es/omit";

const useStore = create((set) => ({
  salmon: 1,
  tuna: 2,
  // clears the entire store, ACTIONS INCLUDED
  deleteEverything: () => set({}, true),
  deleteTuna: () => set((state) => omit(state, ["tuna"]), true),
}));
```

#### Async actions

Zustand doesn't care if you actions are async or not just call set when you are ready.

```ts
const useStore = create((set) => ({
  fishies: {},
  fetch: async (pond) => {
    const response = await fetch(pond);
    set({ fishies: await response.json() });
  },
}));
```

<div id="read-state-from-actions">

#### Read from state in actions

**set** function allows you to change state, similarly you can use **get** to read state.

```ts
const useStore = create((set, get) => ({
  sound: "grunt",
  action: () => {
    // reading state => "grunt"
    const sound = get().sound
  }
})
```

<div id="rw-outside">

#### Reading/Writing and Reacting to Changes outside of components

```ts
// creating store
const useStore = create(() => ({ paw: true, snout: true, fur: true }));

// Getting non-reactive fresh state
const paw = useStore.getState().paw;

// Listening to all changes, fires synchronously on every change
const unsub1 = useStore.subscribe(console.log);

// Updating state, will trigger listeners
// In our case this will fire console.log
useStore.setState({ paw: false });

// Unsubscribe listeners
unsub1();

// Destroying the store (removing all listeners)
useStore.destroy();

// You can of course use the hook as you always would
function Component() {
  const paw = useStore((state) => state.paw);
}
```

If you take a look above at our **subscribe** you can notice that it subscribes to any change made inside that store. If you need to subscribe to some slice of state you can use a selector, but first you need to use **subscribeWithSelector** middleware which will allow **subscribe** to take selector as first argument.

```ts
import { subscribeWithSelector } from "zustand/middleware";
const useStore = create(
  subscribeWithSelector(() => ({ paw: true, snout: true, fur: true }))
);

// Listening to selected changes, in this case when "paw" changes
const unsub1 = useStore.subscribe((state) => state.paw, console.log);

// Subscribe also exposes the previous value
const unsub2 = useStore.subscribe(
  (state) => state.paw,
  (paw, previousPaw) => console.log(paw, previousPaw)
);

// Subscribe also supports an optional equality function
const unsub3 = useStore.subscribe(
  (state) => [state.paw, state.fur],
  console.log,
  { equalityFn: shallow }
);

// Subscribe and fire immediately
const unsub4 = useStore.subscribe((state) => state.paw, console.log, {
  fireImmediately: true,
});
```

<div id="persist">

#### Persist middleware

You can persist your store's data using any kind of storage.

```ts
import create from "zustand";
import { persist } from "zustand/middleware";

export const useStore = create(
  persist(
    (set, get) => ({
      fishes: 0,
      addAFish: () => set({ fishes: get().fishes + 1 }),
    }),
    {
      // unique name
      name: "food-storage",
      // (optional) by default, 'localStorage' is used
      getStorage: () => sessionStorage,
    }
  )
);
```

#### serialize

###### Default (state) => JSON.stringify(state)

Since the only way to store an object in a storage is via a string, you can use this option to give a custom function to serialize your state to a string.

```ts
// For example, if you want to store your state in base64
export const useStore = create(
  persist(
    (set, get) => ({
      // ...
    }),
    {
      // ...
      serialize: (state) => btoa(JSON.stringify(state)),
    }
  )
);
```

#### deserialize

###### Default (str) => JSON.parse(str)

```ts
// Deserialize the base64 value
export const useStore = create(
  persist(
    (set, get) => ({
      // ...
    }),
    {
      // ...
      deserialize: (str) => JSON.parse(atob(str)),
    }
  )
);
```

#### partialize

###### Default (state) => state

Enables you to omit some of the state's fields to be stored in the storage.

You can allow specific fields:

```ts
export const useStore = create(
  persist(
    (set, get) => ({
      foo: 0,
      bar: 1,
    }),
    {
      // ...
      partialize: (state) => ({ foo: state.foo }),
    }
  )
);
```

You can omit multiple fields:

```ts
export const useStore = create(
  persist(
    (set, get) => ({
      foo: 0,
      bar: 1,
    }),
    {
      // ...
      // Example below equates to (state) => { bar: state.bar }
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => !["foo"].includes(key))
          // Object.entries(state) => [['foo', 0], ['bar', 1]]
          // filter => [['bar', 1]]
          // Transforms list of key-val pairs into object. Like Map => Object
          // Object.fromEntries => { bar: 1 }
        ),
    }
  )
);
```

<div id="persist-api">

### API

The persist api enables you to do numbers of interactions with the persist middleware from inside or outside a React component.

**setOptions** enables you to change persist options like name or storage engine

```ts
// change name under which STORE data is stored
useStore.persist.setOptions({
  name: "new-name",
});

// Storage engine
useStore.persist.setOptions({
  getStorage: () => sessionStorage,
});
```

**clearStorage** is used to fully clear the persisted value in the storage.

```ts
useStore.persist.clearStorage();
```

#### Practice with no store actions

Recommended usage from main Readme is to create self-contained store with data and actions together like this:

```ts
export const useStore = create((set) => ({
  count: 0,
  text: 'hello',
  inc: () => set((state) => ({ count: state.count + 1 })),
  setText: (text) => set({ text }),
})
```

Alternative to this is to define actions at module level external to the store

```ts
export const useStore = create(() => ({
  count: 0,
  text: 'hello',
})

// setState like getState is utility used to access and manage store from outside
// functional component
export const inc = () => useStore.setState((state) => ({ count: state.count + 1 }))

export const setText = (text) => useStore.setState({ text })
```

<div id="store-split">
  
## Spliting store into separate slices

You can split your store into small and manageable slices.
example below is practice for typescript:

```ts
// createBearSlice.ts
import { GetState, SetState } from "zustand";
import { MyState } from "./useStore";

export interface BearSlice {
  eatFish: () => void;
}

const createBearSlice = (set: SetState<MyState>, get: GetState<MyState>) => ({
  eatFish: () => {
    set((prev) => ({ fishes: prev.fishes > 1 ? prev.fishes - 1 : 0 }));
  },
});

export default createBearSlice;
```

```ts
// createFishSlice.ts
import { GetState, SetState } from "zustand";
import { MyState } from "./useStore";

export interface FishSlice {
  fishes: number;
  repopulate: () => void;
}

const maxFishes = 10;

const createFishSlice = (set: SetState<MyState>, get: GetState<MyState>) => ({
  fishes: maxFishes,
  repopulate: () => {
    set((prev) => ({ fishes: maxFishes }));
  },
});

export default createFishSlice;
```

```ts
import create from "zustand";

import createBearSlice, { BearSlice } from "./createBearSlice";
import createFishSlice, { FishSlice } from "./createFishSlice";

export type MyState = BearSlice & FishSlice;

const useStore = create<MyState>((set, get) => ({
  ...createBearSlice(set, get),
  ...createFishSlice(set, get),
}));

export default useStore;
```

<div id="nested-objects">
  
## Updating nested state object values

If you have a deep state object like this:

```ts
type State = {
  deep: {
    nested: {
      obj: { count: number };
    };
  };
};
```

It requires some effort to update the count, normal approach is to copy state object with <code>...</code>

```ts
normalInc: () =>
    set((state) => ({
      deep: {
        ...state.deep,
        nested: {
          ...state.deep.nested,
          obj: {
            ...state.deep.nested.obj,
            count: state.deep.nested.obj.count + 1
          }
        }
      }
    })),
```

This is long you can use immer to reduce this down to:

```ts
immerInc: () =>
    set(produce((state: State) => { ++state.deep.nested.obj.count })),
```
