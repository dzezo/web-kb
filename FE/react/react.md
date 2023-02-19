# React

1. [Introduction](#introduction)
2. [Creating Component](#create-component)
3. [Props](#props)
4. [Styling](#styling)
5. [useState](#use-state)
6. [useEffect](#use-effect)
7. [useRef](#use-ref)
8. [useMemo](#use-memo)
9. [useLayoutEffect](#use-layout-effect)
10. [useCallback](#use-callback)
11. [useReducer](#use-reducer)
12. [Context](#context)
13. [Pitfalls](#pitfalls)
14. [Dealing with TS](#react-ts)

<div id="introduction">

## Intro

State in react is an object that determines how a component renders and behaves. Any data that you bring into a component is also part of the state. And if you want to share that data across multiple components and in that case you are going to use what's called App or global state. And if you end up having alot of app level state then you should look into Context API that is built into React or user 3rd party libs like Recoil/Redux.
Prior to 16.8 you had to use class based components to hold state. Now you can use functional components with hooks to accomplish the same thing.
React hooks are functions that let us hook into the React state and lifecycle features.
useState - Returns stateful value and a function to update it
useEffect - Performs side effects in function components (Biggest use HttpRequest)

<div id="create-component">

## Creating Component

You can use rafc (React Arrow Function Component) to create boilerplate for some component.

<div id="props">

## Props

Whenever you are passing props to a component you need to use {} for anything other then string. You can create default prop inputs by declaring default props object

```ts
Component.defaultProps = { title: "Some default title" };
```

You can also strong type PropTypes by importing propTypes from react using 'impt' command. and then defining them like:

```ts
Header.propTypes = { title: PropTypes.string.isRequired };
```

in this case we defined title as required prop of type string.
You can use spread operator on component like this:

```tsx
<Tour key={tour.id} {...tour} />
```

it will match component props with object properties

<div id="styling">

## Styling

Unlike usual HTML you need to use className instead of class.

In react you can use inline styling like this:

<div style={{ backgroundColor: red, color: white }}></div>

or you can create separate object:

```ts
const style = {
  backgroundColor: red,
  color: white,
};
```

and then use it like this:

```ts
<div style={style}></div>
```

<div id="use-state">

## useState

```ts
const [tasks, setTasks] = useState([
  {
    id: 1,
    text: "Doctor Appointment",
    day: "Feb 5th at 2:30pm",
    reminder: true,
  },
  {
    id: 2,
    text: "Meeting at School",
    day: "Feb 6th at 2:30pm",
    reminder: true,
  },
  {
    id: 3,
    text: "Food Shooping",
    day: "Feb 7th at 2:30pm",
    reminder: true,
  },
  {
    id: 4,
    text: "Yoga Class",
    day: "Feb 7th at 5:30pm",
    reminder: false,
  },
]);
```

- task - stateful value
- setTask - function to change state
- argument of useState hook is default value for tasks

One thing to notice here is that you can't use for example:

```ts
task.push(some_val);
```

because state is immutable. To change state you would need to use function to change state in this case:

```ts
setTask([...tasks, { new_obj }]);
```

<div id="use-effect">

## useEffect

```tsx
const [alert, setAlert] = useState(false);

useEffect(() => {
  const timeout = setTimeout(() => {
    setAlert(false);
  }, 3000);

  return () => clearTimeout(timeout);
}, [alert]);

<button
  onClick={() => {
    setAlert(true);
    navigator.clipboard.writeText("hex");
  }}
/>;
```

We used **navigator.clipboard.writeText(someProp)** to copy some value to our clipboard, on that click event we are also setting our alert state to true and this is causing React to re-render component and when it does so it will see useEffect hook and check it's dependencies. Once React looks and compares values of alert it will execute useEffect function again because state has changed.

Common mistake with using react useEffect hook:

```tsx
const Timer = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount(count + 1);
    }, [1000]);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return <div>Timer: {count}</div>;
};
```

So the idea behind this component is to create a simple timer that is going to increment count state every 1s. So this seems alright at first glance because we are executing useEffect only once on first mount thus initializing only one interval and we are seting new count state every 1s which is going to trigger re-render and display new count.

But here is the catch you see we are **always going to display 1** even tho we are seting our state to **count+1** every sec, that's because this useEffect closure was called only once at first mount and at that moment count was 0 so it retained count value as 0 so it's basically doing 0 + 1 every second and thus we see only 1.

To amend this we need to use different version of state setter that gives you the current value and allows you to return new value.

```ts
setCount((currentCount) => currentCount + 1);
```

<div id="use-ref">

## useRef

First use of this hook is to persist state between renders, because changing ref value is not causing component to render again, unlike useState hook. useRef hook always returns an object that looks like this: { current: defaultVal }

```ts
const value = useRef(0);
console.log(value.current); // will print 0
```

Second use for this hook and it's main purpose is to reference dom nodes using ref property that's available on each element like this:

```tsx
const inputRef = useRef()
const focus = () => inputRef.current.focus() // .current is important

<input ref={inputRef} />
<button onClick={focus}>Focus</button>
```

<div id="use-memo">

## useMemo

This hook is used to store some variable in memory and update it only if changes occur, for example:

```ts
const number = useMemo(() => slowFunction(number), [number]);
```

First argument of useMemo hook is change handler for that variable and second argument is ofcourse dependency array.
This is case above is common case when we have some computed variable that takes long to get calculated, so we are going to wrap it in useMemo to cache it in memory and make it recompute only if relevant part of it changes. If we would to do something like this:

```ts
const number = slowFunction();
```

, in our component then this function would get executed on every render of that component which would slow down entire application. And re-rendering can be caused by changes to the state within component or within parent component. And that state doesn't have to be related to our variable.

Second biggest use case is when we want to pass same object or array to dependency list. In JS object and arrays are compared by their reference which means that this down bellow is not equal

```ts
const obj1 = { a: 1 };
const obj2 = { a: 1 };
```

, event tho these are the same objects.

now lets say that we have a useEffect hook that we want to run when obj1 changes like this for example:

```ts
const useEffect(() => console.log('hi'), [obj1])
```

this would run every time we update obj1, but it would also run when we change some other state in our component! That is happening because every time component renders again variables are being re-asigned. So on next render obj1 would still be { a: 1 } but it will have different address, so react would see it as a change and it would run useEffect hook, that's why we need to persist this variable and wrap it with useMemo.

```ts
const obj1 = useMemo(() => {
  a: 1;
}, []);
```

<div id="use-layout-effect">

## useLayoutEffect

useLayoutEffect radi apsolutno isto kao useEffect hook, razlika u tome je sto se useEffect hook izvrsava asinhrono dok se useLayoutEffect izvrsava sinhrono.

Ovo sinhrono znaci da je njegova pozicija izvrsenja tacno odredjena i ovaj hook se izvrsava nakon sto se izracuna layout i pre nego sto se nacrta u browser-u, iz ovog razloga je ovaj hook pogodan za stvari kao sto su popup-ovi i modali jer nam je prvo potrebno da znamo poziciju roditeljskog kontejnera pre nego sto se prikaze, kako bi odredili gde on treba da bude.

```tsx
const [show, setShow] = useState(false);
const popup = useRef();
const button = useRef();

useEffect(() => {
  if (popup.current == null || button.current == null) return;

  // Every time show changes
  // This will get bottom value of our related element
  // and calculate popup position based on it
  const { bottom } = button.current.getBoundingClientRect();
  popup.current.style.top = `${bottom + 25}px`;
}, [show]);

return (
  <>
    <button ref={button} onClick={() => setShow((prev) => !prev)}>
      Show
    </button>
    {show && (
      <div style={{ position: "absolute" }} ref={popup}>
        This is popup
      </div>
    )}
  </>
);
```

<div id="use-callback">

## useCallback

Lets say that we have a search box and we want to fetch some data from our backend whenever new search term gets enter. In this case we can defined useEffect hook in our global context like this:

```ts
const [searchTerm, setSearchTerm] = useState("a");

useEffect(() => {
  fetchDrinks();
}, [searchTerm]);
```

Now this code will throw warning at us that we did not include fetchDrink function as dependency for our useEffect hook. And we need to include it because fetchDrink is a function **VARIABLE** and it changes on every render.

But now for a twist if we put it into dependencies of useEffect hook we will create infinite loop. Because when fetchDrinks fires first time it will cause component to render again, and if component renders again fetchDrinks function variable will get different reference which will be detected in useEffect hook as a change and it will fire fetchDrinks again and again. Remember how we need to map/filter etc in order to crate array with new address reference which in turn will cause hook to fire, same logic applies here.

Function will be the same as on previous render but it's refrence will not be and that is the problem

So if we ought to put our function as a dependency we need to keep its refrence and change it only when function needs to be changed structuraly. And this refrence saving is possible with useCallback hook

```ts
const fetchDrinks = useCallback(async () => {
  setLoading(true);

  try {
    const res = await fetch(`${url}${searchTerm}`);
    const data = await res.json();
    const { drinks } = data;

    ...

    setLoading(false);
  } catch (e) {
    console.error(e);
    setLoading(false);
  }
}, [searchTerm]);
```

as we can see useCallback hook takes dependencies as second parameter and we can put searchTerm as our dependency so that this function gets rebuild only if our searchTerm changes.

<div id="use-reducer">

## useReducer

useReducer hook in global context allows you to have one state object instead of having multiple useState hooks, and it's similar to what i did in Angular when it comes to Action handling. You have this functions in React Context that call dispatch function on some Action.
Action is object that has following interface:

```ts
interface Action {
  type: string; // in capital letter because that is the convention
  payload: any; // some data that will be passed on to reducer function
}
```

We would define some initialState for our app context like so:

```ts
const initialState = {
  loading: false,
  cart: cartItems,
  total: 0,
  amount: 0,
};
```

and then declare useReducer in our provider:

```ts
const [state, dispatch] = useReducer(reducer, initialState);
```

one thing to note here is that we have reducer function as first parameter. That function is going to be defined in separate file, and it is carbon copy of my ActionHandler function in Angular. Second parameter is initialState of this context component and it is declared before useReducer hook as seen above. This hook also returns array that we can destrucutre.

First item will be state of our context component that we can pass in our AppContext.Provider component like so:

```tsx
<AppContext.Provider
  value={{
    ...state,
    clearCart,
    remove,
    increase,
    decrease,
  }}
>
  {children}
</AppContext.Provider>
```

Second item will be dispatch method that will invoke our reducer function and we can use it in our context functions like this for example:

```ts
useEffect(() => {
  dispatch({ type: "GET_TOTALS" });
}, [state.cart]);
```

Now in this example we can see that we use useEffect hook that will trigger anytime contet of our cart changes, and when it trigger it will dispatch GET_TOTALS action.

This dispatch will then execute some part of reducer function example below:

```ts
const reducer = (state, action) => {
  switch (action.type) {

  	...

    case "GET_TOTALS":
      let { total, amount } = state.cart.reduce(
        (cartTotal, cartItem) => {
          const { price, amount } = cartItem;
          cartTotal.amount += amount;
          cartTotal.total += price * amount;
          return cartTotal;
        },
        { total: 0, amount: 0 }
      );

      total = parseFloat(total.toFixed(2));

      return { ...state, total, amount };
    case "LOADING":
      return { ...state, loading: true };
    case "DISPLAY_ITEMS":
      return { ...state, cart: action.payload, loading: false };
    default:
      break;
  }
  return state;
};

export default reducer;
```

now our reducer function will take state of our context and action that has been dispatched and we can switch to specific part of code depending on type of action that has been dispatched. For our previous example we are going to hit this GET_TOTALS case.

<div id="context">

## React Context

React has built-in function to manage global state and it's called React Context. You should hold your state in folder named store, that's common convention.
React Context behaves like a normal React Component. In order to create React Context first you need to instantiate Context Object that's done using createContext:

```tsx
import { createContext, useState } from "react";

// it takes default value and then it returns context object
// you can access it's provider by typing FavortiesContext.Provider
const FavoritesContext = createContext({
  favorites: [],
  totalFavorites: 0,
  addFavorite: (favoriteMeetup) => {},
  removeFavorite: (meetupId) => {},
  itemIsFavorite: (meetupId) => {},
});

/**
  You can define how context look by passing object to createContext Function. 
  Then you have to create component function for this context: 
*/

export const FavoritesContextProvider = (props) => {
  const [userFavorites, setUserFavorites] = useState([]);

  // concat - works like push but returns new array
  const addFavoriteHandler = (favoriteMeetup) => {
    setUserFavorites((prevUserFavorites) => {
      return prevUserFavorites.concat(favoriteMeetup);
    });
  };

  const removeFavoriteHandler = (meetupId) => {
    setUserFavorites((prevUserFavorites) => {
      return prevUserFavorites.filter((meetup) => meetup.id !== meetupId);
    });
  };

  // some - will return true if some element meets given condition
  const itemIsFavoriteHandler = (meetupId) => {
    return userFavorites.some((meetup) => meetup.id === meetupId);
  };

  const context = {
    favorites: userFavorites,
    totalFavorites: userFavorites.length,
    addFavorite: addFavoriteHandler,
    removeFavorite: removeFavoriteHandler,
    itemIsFavorite: itemIsFavoriteHandler,
  };

  return (
    <FavoritesContext.Provider value={context}>
      {props.children}
    </FavoritesContext.Provider>
  );
};
```

Idea behind this is to wrap Context Component around any component that needs scope on this state. That's why we are creating this "parent" component that will hold some state. You can see that in argument of this component it takes props, you need to embed children.

Now inside this component you can define useState hook like you would in any normal component then you need to create context object that resembles main context object. This object that contains state values is going to get passed to value prop of Context Object:

```tsx
<FavoritesContext.Provider value={context}>
  {props.children}
</FavoritesContext.Provider>
```

This is important because React is re-rendering component every time it's state changes since we are wrapping this around all components that want scope on this state, they are also going to get re-rendered every time state changes so they will have latest state available for display.

One important thing for useState hook. if you change state like this:

```ts
const addFavoriteHandler = (favoriteMeetup) => {
  setUserFavorites(userFavorites.concat(favoriteMeetup));
};
```

it will work, but React is dealing with this by scheduling it for later. Ofcourse this comes fast, but if you want to have latest state available immediately then you have to use setter version that takes function:

```ts
const addFavoriteHandler = (favoriteMeetup) => {
  setUserFavorites((currentFavs) => {
    return currentFavs.concat(favoriteMeetup);
  });
};
```

Now to work with React context in child component you need to use special hook for that called useContext and you need to import context object from context file.
which should get exported as default for that file, and when you do so you can then importing into child component like:

```ts
import { useContext } from "react";
import FavoritesContext from "../../store/favorites-context";

// then you need to use hook to attach to this context
const favoritesCtx = useContext(FavoritesContext);

/*
  now you have access to everything defined within FavoritesContext, 
  and you can do something like this:
*/

let content;
// One interesting thing to note here is that you can store JSX Elements
// as variables and then use them.
if (favoritesCtx.totalFavorites === 0) {
  content = <p>You got no favorites yet. Start adding some?</p>;
} else {
  content = <MeetupList meetups={favoritesCtx.favorites} />;
}

return (
  <section>
    <h1>My Favorites</h1>
    {content}
  </section>
);
```

<div id="pitfalls">

## Pitfalls

##### Example 1.

```ts
const [count, setCount] = useState(0);

function incrementCount() {
  setCount(count + 1);
  console.log(count);
}
```

First mistake this console.log will return previous state, in our case even tho we changed count to 1 it will display 0, and that is because setCount is async function therefore console.log will get executed first.

Second mistake arises when we have example like this

```ts
// This closure will have count = 0
function incrementCount() {
  setCount(count + 1);
  setCount(count + 1);
  console.log(count);
}
```

Result of count will still be 1 even tho we incremented twice that is because at the time of invocation we passed count = 0 value to setCount async function, so both set functions executed 0 + 1 and set state to be 1.

To remedy this we need to change our code to this:

```ts
function incrementCount() {
  setCount((prev) => prev + 1);
}

useEffect(() => console.log(count), [count]);
```

now we are forcing set state to take prev. value into consideration before returning new value and we can chain this setCounts and it will return desired result. Second fix is usage of useEffect hook which will execute console.log only when count changes, in our previous example console.log was executed prematurly.

##### Example 2.

```tsx
const [name, setName] = useState()

<input value={name} onChange={e => setName(e.target.value)} />
```

There is a mistake here we defined name state without initial value and we are using it in a controlled input component, which will throw a warning because we are switching to controlled from uncontrolled

Difference between controlled and uncontrolled components.

Value of uncontrolled component is managed by DOM and can be access in code with reference like this

```tsx
const input = useRef()
<input ref={input} />
```

Example of such component is input **type='file'** because it's value can only be set by user and not programmatically.

If we have some event handler for each state of component then we have controlled component like in our example above with onChange.

## Dealing with TS

<div id="introduction">

#### Creating project

```
npx crate-react-app --template typescript app_name
```

#### Handling State

```tsx
const [number, setNumber] = useState<number | string>(5);

interface People {
  name: string;
  age: number;
  url: string;
  note?: string;
}

const [people, setPeople] = useState<People[]>([]);
```

#### Handling Props

```tsx
// functional component
const List: React.FC<People> = () => {
  // component body
};
```

#### Handling Functions

```tsx
const renderList = (): JSX.Element[] => {
  return people.map((person) => <div>{person.name}</div>);
};
```

#### Handling Events

```tsx
const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  setForm({
    ...form,
    [e.target.name]: e.target.value,
  })
}

<input
  name="name"
  value={form.name}
  onChange={handleChange}
/>
<textarea
  name="note"
  value={form.note}
  onChange={handleChange}
/>
```
