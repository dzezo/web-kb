## Routing

There is no routing included with the core lib. You need to use package: react-router-dom

The main thing that needs to be imported is:

```ts
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
```

After that you will need to wrap your return with BrowserRouter aka Router. Once you do that you will can insert and HTML element with that Router component element, But once you decide to set up your dynamic routes you will need to wrap each Route with Routes wrapper. Inside Routes wrapper only Route components can exist.

```tsx
<Route
  path="/"
  element={
    <>
      <Header
        showAdd={showAddTask}
        onAdd={() => setShowAddTask(!showAddTask)}
      />
      {showAddTask && <AddTask onAdd={addTask} />}
      {tasks.length > 0 ? (
        <Tasks tasks={tasks} onDelete={deleteTask} onToggle={toggleReminder} />
      ) : (
        "No Tasks To Show"
      )}
      <Footer />
    </>
  }
/>
```

It's path props defines route at which element will be rendered. Element prop takes JXS.Element and like every other component in React it can only return one thing so make sure to wrap it with <> (empty tag) if needed

### Links

You can trigger parent Router from some component with Links:

```tsx
import { Link } from "react-router-dom";

<Link to={`/task/${task.id}`}>View Task</Link>;
```

### Params, Navigate & Location

```ts
import { useLocation, useNavigate, useParams } from "react-router-dom";
```

As you may noticed there's param in previously mentioned route (task.id), in order to get ahold of this param you will need to use useParams hook.

```ts
const params = useParams();
const res = await fetch(`http://localhost:5000/tasks/${params.id}`);
```

if for example error occurs during this fetch you can redirect to some other route using useNavigate hook

```ts
const navigate = useNavigate();
if (res.status === 404) navigate("/");
```

If you want to know more about your current location within application you can use useLocation hook, following is example of how you can see your current pathname

```ts
const { pathname } = useLocation();
```

In react router v6 you don't need to pass exact prop that is now default
Meaning if you have **path='/products'** it will match that exact path
If you want react-router to match routes that start with **/products**
Then you would do it like this: **path='/products/\*'**

In order to add active class to your NavLink you would have to do this:

```tsx
// As you can notice className has a function that has one argument.
// That argument is provided by react-router and is an object that contains
// property like .isActive which can be used to set active class

<NavLink className={ navData => navData.isActive ?? class.active } to="/">
Home
</NavLink>
```

To perform redirect you can use something like this

```tsx
<Route path="/" element={<Navigate to="/welcome" />} />
```

As you can see from the example above if path matches / you will be
redirected to /welcome path.
This will push /welcome page to navigation stack which is something that we
may not want to do so instead we can use replace prop to replace that route
on the navigation stack like this:

```tsx
<Navigate replace to="/welcome" />
```

## Nested routes

One thing to note here is usage of asteriks in **/welcome/\*** which will make
React match all routes that starts with welcome.
Now in child components all **routes are relative** so you dont need to add
**/welcome/new-user** or **/new-user**, just simply put new-user, see example below:

```tsx
// app.tsx
<Router>
    <Routes>
        <Route path="/" element={<Navigate to="/welcome" />} />
        <Route path="/welcome/*" element={<Welcome />} />
    <Routes>
</Router>
```

```tsx
// welcome.tsx
// Link that is inside a component loaded with Route is also relative
// so you can use something like ../some-other-route
<Link to="" />
<Routes>
	<Route path="new-user" element={<p>Welcome user...<p/>} />
</Routes>
```

There is another way to do the thing above, in app.js file you can rewrite
your code to this:

```tsx
<Router>
	<Routes>
		<Route path="/" element={<Navigate to="/welcome" />} />
		<Route path="/welcome/*" element={<Welcome />}>
			<Route path="new-user" element={<p>Welcome user...<p/>} />
		</Route>
	<Routes>
</Router>
```

As you can see Route here is no longer self closing tag. This way you can have all your routes at the same place.

Now one interesting thing here is, where is this **p** tag going inside Welcome component?

This is done by using placeholder component called **Outlet** which you can
use inside welcome component to tell router where you want your **p** tag to
be inserted.

## Imperative navigation

Navigation when some action is finished or some button was clicked, and this can be done using react-router hook useNavigate.

```ts
const navigate = useNavigate();
navigate("/welcome"); // simple navigation
navigate("/welcome", { replace: true }); // redirection
```

You can also use numbers like -1 to go to previous page or 1 to go forward.

## PROTECTED ROUTES

```tsx
<AuthProvider>
  <Routes>
    <Route element={<Layout />}>
      <Route path="/" element={<PublicPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/protected"
        element={
          <RequireAuth>
            <ProtectedPage />
          </RequireAuth>
        }
      />
    </Route>
  </Routes>
</AuthProvider>
```

AuthProvider is React Context that holds state of authenticated user something like this:

```ts
interface AuthContextType {
  user: any;
  signin: (user: string, callback: VoidFunction) => void;
  signout: (callback: VoidFunction) => void;
}

let AuthContext = React.createContext<AuthContextType>(null!);
```

Our auth provider looks something like this:

```ts
function AuthProvider({ children }: { children: React.ReactNode }) {
  let [user, setUser] = React.useState<any>(null);

  let signin = (newUser: string, callback: VoidFunction) => {
    return fakeAuthProvider.signin(() => {
      setUser(newUser);
      callback();
    });
  };

  let signout = (callback: VoidFunction) => {
    return fakeAuthProvider.signout(() => {
      setUser(null);
      callback();
    });
  };

  let value = { user, signin, signout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook, that basically exposes context to some component
function useAuth() {
  return React.useContext(AuthContext);
}
```

Require Auth component simply grabs AuthContext to expose auth.user, and it asks whether auth.user exists.
If user is logged it will display children component <ProtectedPage />

```tsx
function RequireAuth({ children }: { children: JSX.Element }) {
  let auth = useAuth();
  let location = useLocation();

  if (!auth.user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
```

One thing to note here this RequireAuth component will render if exact route
in this case **/protected** is hit. When that occurs useLocation hook from
react-router-dom will take router location and store it inside state prop
look at the object that is passed { from: location }
This state prop can then be used in LoginPage to redirect back to desired page for better UX.

```tsx
function LoginPage() {
  let navigate = useNavigate();
  let location = useLocation();
  let auth = useAuth();

  // see Navigation path from RequireAuth component above
  let from = location.state?.from?.pathname || "/";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    let formData = new FormData(event.currentTarget);
    let username = formData.get("username") as string;

    auth.signin(username, () => {
      // because we passed location as a state we can navigate back to that
      // authorized page after signing was success
      navigate(from, { replace: true });
    });
  }
}
```

Lazy loading is achived with dynamic loading import statment for example About page is not loaded until you click About link, once you do
click React.Suspense fallback will render while the code is loaded via
dynamic import

```tsx
const About = React.lazy(() => import("./pages/About"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));

<Routes>
  <Route path="/" element={<Layout />}>
    <Route index element={<Home />} />
    <Route
      path="about"
      element={
        <React.Suspense fallback={<>...</>}>
          <About />
        </React.Suspense>
      }
    />
    <Route
      path="dashboard/*"
      element={
        <React.Suspense fallback={<>...</>}>
          <Dashboard />
        </React.Suspense>
      }
    />
    <Route path="*" element={<NoMatch />} />
  </Route>
</Routes>;
```

### Rendering

There are three rendering concepts: Outlets, Index Routes, Layout Routes.
Lets take this example

```tsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<App />}>
      <Route index element={<Home />} />
      <Route path="teams" element={<Teams />}>
        <Route path=":teamId" element={<Team />} />
        <Route path="new" element={<NewTeamForm />} />
        <Route index element={<LeagueStandings />} />
      </Route>
    </Route>
    <Route element={<PageLayout />}>
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/tos" element={<Tos />} />
    </Route>
    <Route path="contact-us" element={<Contact />} />
  </Routes>
</BrowserRouter>
```

if we use lets say /teams what react element team will look something like:

```tsx
<App>
  <Teams>
    <LeagueStandings />
  </Teams>
</App>
```

Take a look at LeagueStandigs Route element, instead of path it has **index** You can think of it as **default path** if none other is matched, like in our case.
Position of Teams and LeagueStandings elements is determined by position of **Outlet** element within their parent components

There is another weird route which contains **PageLayout element**. This Route is pathless, and it helps us write cleaner and non-repetative code example below:

```tsx
<Route element={<PageLayout />}>
  <Route path="/privacy" element={<Privacy />} />
  <Route path="/tos" element={<Tos />} />
</Route>
```

This code can also be written as:

```tsx
<Route
    path="/privacy"
    element={
        <PageLayout>
            <Privacy />
        </PageLayout>
    }
/>
<Route
    path="/tos"
    element={
        <PageLayout>
            <Tos />
        </PageLayout>
    }
/>
```

You can notice the repetition of PageLayout, that is why pathless route comes in handy.

### useRoutes hook

This Route tree that you saw above, can be written using useRoutes hook and actually that is how it works under the hood. You can do something like

```ts
let routes = [
  {
    element: <App />,
    path: "/",
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "teams",
        element: <Teams />,
        children: [
          {
            index: true,
            element: <LeagueStandings />,
          },
          {
            path: ":teamId",
            element: <Team />,
          },
          {
            path: ":teamId/edit",
            element: <EditTeam />,
          },
          {
            path: "new",
            element: <NewTeamForm />,
          },
        ],
      },
    ],
  },
  {
    element: <PageLayout />,
    children: [
      {
        element: <Privacy />,
        path: "/privacy",
      },
      {
        element: <Tos />,
        path: "/tos",
      },
    ],
  },
  {
    element: <Contact />,
    path: "/contact-us",
  },
];
```

You can create object like this which look alot like Angular and then use useRoutes hook which takes this obj as argument
