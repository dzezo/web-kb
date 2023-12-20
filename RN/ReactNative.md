# React Native

## React Native Basics

### Core Components & Component Styling

We use React Native core components to create any Component we may need. Think of native components as a set of HTML elements we can use to create layouts. Next important thing is styling, and since we are not using ReactDOM we can't write CSS.

Two most essential components are `<View />` and `<Text />`. You can think of View as `<div />` equivalent in mobile world. The only difference here is that we can't use plain text as a child of that div which is valid on web. To render text we need to wrap it in `<Text />` component.

Styles in React Native are written in Javascript and inspired by CSS. You pass style to a component using `style` prop which expects Javascript object.

```jsx
import { Text, StyleSheet } from "react-native";

const styles = StyleSheet.create({
  button: {
    borderWidth: 2,
    borderColor: "red",
    padding: 16,
    margin: 16,
  },
});

export function App() {
  return <Text sstyle={styles.button}>Hello world</Text>;
}
```

RN tries its best to work on both Android and IOS but sometimes we need to write code for both platforms. Great example of that is styling.

```jsx
const styles = StyleSheet.create({
  text: {
    margin: 8,
    padding: 8,
    borderRadius: 6,
    backgroundColor: "black"
    color: "white"
  }
})

<Text sstyle={styles.text}>Some text</Text>
```

This code will render text box on both devices but only Android devices will have rounded corner. Thats because Text component on IOS doesn't support rounded corners. So we need to think of a workaround, what we can do is wrap this text in View component since it supports rounded corners on both devices

```jsx
<View sstyle={styles.text}>
  <Text>Some text</Text>
</View>
```

Now we have a different problem our text color is black, that is because this is not CSS and **styles are not cascading** like that do on browser. This means that children are not inheriting styles from parent!
We need to separate styles in order to make it work, example:

```jsx
const styles = StyleSheet.create({
  textWrapper: {
    margin: 8,
    padding: 8,
    borderRadius: 6,
    backgroundColor: "black"
  },
  text: {
    color: "white"

  }
})

<View sstyle={styles.textWrapper}>
  <Text sstyle={styles.text}>Some text</Text>
</View>
```

### Flexbox

Layouts are typically created with Flexbox which works similarly to browser CSS flexbox, but unlike web here every View component, div equivalent, by default uses flexbox with direction set to column.

### Handling Events

RN exposes different event handlers you can use, for example Button component on web would expose onClick handler, but on mobile devices we have press instead.

```jsx
export default function App() {
  function inputHandler(enteredText) {}
  function clickHandler() {}

  return (
    <View>
      <TextInput placeholder={"Enter text..."} onChangeText={inputHandler} />
      <Button title={"Click me"} onPress={clickHandler} />
    </View>
  );
}
```

### Scrollable Content

Whenever we exceed viewport height our content doesn't automatically get scrollbar like it does on the web. We need to tell native platform that View is scrollable and we can do so by utilizing `ScrollView` component.

```jsx
<ScrollView>
  {data.map((item) => (
    <Text key={item.id}>{item.name}</Text>
  ))}
</ScrollView>
```

`ScrollView` component is great for limited amounts of content, but using it for long lists can have performance implications because every item of that list will be rendered. In scenarios where we can have hundreds or thousands of items its better to use `FlatList`, think of it as virtualized list.

```jsx
<FlatList
  data={data}
  keyExtractor={(item) => item.id}
  renderItem={(fli) => {
    return <Text>{fli.item.name}</Text>;
  }}
/>
```

There are two ways in which you can provide key property to this virtualized list. First one is to have an array of records, where each record has key property, second approach is to define `keyExtractor` function.

### Pressable

When we want to create some component that should have `onClick` event we need to wrap it in a `Pressable` component. That is beacause click event is web specific.
Pressable component exposes `style` prop which can take a function that has pressed as an argument, by using this you can manipulate styles after component has been pressed.

```jsx
function pressHandler() {
  // handle press
}

<Pressable
  onPress={pressHandler}
  style={({ pressed }) => pressed && styles.pressedItem}
>
  <View>
    <Text>Some text...</Text>
  </View>
</Pressable>;
```

### Modal

RN also has component for overlay view simply called `Modal`

```jsx
const [isVisible, setIsVisible] = useState(true);

<Modal visible={isVisible} animationType={"slide"}>
  <View>
    <Text>Some text...</Text>
  </View>
  <View>
    <Button title={"Close"} onPress={() => setIsVisble(false)} />
  </View>
</Modal>;
```

### Image

RN does provide component for displaying images called `Image`, one key difference between `<img />` from web is that `src` is not a path to your asset. Image on web performs GET on that address path, in RN you need to use `require` function when requiring image read from some location.

```jsx
<Image src={require("../assets/images/img.png")} style={styles.image} />
```

You can display images from web in RN like this:

```jsx
<Image src={{ uri: imageUrl }} />
```

### Status bar

If we want to work with device status bar Expo provides a component for that called `StatusBar` which exposes `style` prop that takes string: `light`, `dark`, `auto` and `inverted`

## Debugging

### DevTools

Whilst npm-start process is running we can input `?` in terminal to get list of shortcuts we can use. Here you will see that you can press `m` to toggle developer menu, once you press menu will appear on one of your emulators, or you can do `Ctrl + M` for Android and `Ctrl + D` for iOS.

In this developer menu we can click on **Debug JavaScript Remotely**, this will open new tab in Chrome, in that tab you can open developer tools!

### React DevTools

You can use React DevTools, but not extension. You need to install it globally by running `npm i -g react-devtools`, this will give you standalone version of React Devtools which you can start by running `react-devtools`. To connect React Devtools you just need to press Debug Javascript Remotely

## Diving Deep into Components, Layouts and Styling

### Adding shadows to elements

In web world we would use `box-shadow` but in RN that doesn't exist, instead we can use `elevation` for Android and `shadow*` for iOS.

```js
const styles = StyleSheet.create({
  inputContainer: {
    // Android only
    elevation: 8,
    // iOS only
    shadowColor: "black",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 6, // shadow spread
    shadowOpacity: 0.25, // shadow strength
  },
});
```

### TextInput configuration

If you need to control how many characters can be typed into TextInput you can use `maxLength` property which takes number as an argument. This component also allows you to set which keyboard type should be opened by using `keyboardType` property. Be sure to always check device support for each property.

```js
<TextInput
  maxLength={2}
  keyboardType={"number-pad"}
  autoCapitalize={"none"}
  autoCorrect={false}
/>
```

### Custom Button

Common mistake when creating custom buttons is that styles like `android_ripple` on `Pressable` component is shown outside of button. This is because `View` component is inside of `Pressable`, solution is to move it out.
When you want to apply special styles on button press you can pass a function to Pressable `style` prop, if you do so you can access `pressed` variable and conditionaly set different styles.

```js
({ pressed }) =>
  pressed ? [styles.pressable, styled.pressed] : styles.pressable;
```

Note that you can use array when providing styles. When you do so RN will consider all styles you have passed to this array. This is how you can do **cascading styles**! RN will merge this styles together, in this merger **position** in this array **matters**, the bigger the index the more priority it has!

```js
type ButtonProps = {
  label: string,
};

export const Button = ({ label }: ButtonProps) => {
  const pressHandler = () => {
    console.log("button pressed");
  };

  return (
    <View sstyle={styles.view}>
      <Pressable
        sstyle={({ pressed }) =>
          pressed ? [styles.pressable, styled.pressed] : styles.pressable
        }
        onPress={pressHandler}
        android_ripple={{ color: "cyan" }}
      >
        <Text sstyle={styles.text}>{label}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  view: {
    borderRadius: 28,
    margin: 4,
    overflow: "hidden", // to prevent styles from bleeding out
  },
  pressable: {
    backgroundColor: "blue",
    paddingVertical: 8,
    paddingHorizontal: 16,
    elevation: 2,
  },
  pressed: {
    opacity: 0.5,
  },
  text: {
    color: "white",
    textAlign: "center",
  },
});
```

### Linear Gradient

If you want to use linear gradient expo library has component that can help you with that. You need to run `expo install expo-linear-gradient` to install linear-gradient package. You can also do npm install, but by using expo installer you are ensuring installation of fitting version.

```js
import { LinearGradient } from "expo-linear-gradient";

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default function App() {
  return (
    <LinearGradient sstyle={styles.root} colors={["#ddb52f", "#3d021f"]}>
      <StartScreen />
    </LinearGradient>
  );
}
```

### Background Image

`ImageBackground` RN component is simlar to `Image` component, it renders image in the background instead of foreground, as the name suggests.
In the example below `StartScreen` component will be rendered above background image.

```js
export default function App() {
  return (
    <LinearGradient sstyle={styles.root} colors={["#ddb52f", "#3d021f"]}>
      <ImageBackground
        source={require("./assets/images/background.png")}
        resizeMode={"cover"}
        sstyle={styles.root}
        imageStyle={{ opacity: 0.15 }}
      >
        <StartScreen />
      </ImageBackground>
    </LinearGradient>
  );
}
```

Similarly to `Button` component `ImageBackground` RN component is combination of components under the hood, you can check details of its implementation in RN repo. This component is made up of View and Image component `style` prop applies styles to View component, whilst `imageStyle` applies stlyes to underlying Image component.

### Showing Alert

If we want to show alert to the user RN got us covered with Alert API. Alert API exposes `alert` and `prompt`, which uses native dialog underneath. Last argument takes array of buttons to display.

```js
Alert.alert("Invalid number!", "Number has to be a number between 1 and 99", [
  { text: "Okay", style: "destructive", onPress: pressHandler },
]);
```

### SafeAreaView

Some phones have notch at the very top, and we don't want our content to be underneath that. RN provides solution for that with `SafeAreaView` component. We can use this component in our `App.js` file to wrap main content of our screens with it.

### Icons and Custom Fonts

If you want to use SVG icons Expo has library dedicated to this need out of the box called `@expo/vecotr-icons`. You can checkout documentation to see all supported icons.

```js
// importing icon set
import { Ionicons } from "@expo/vector-icons";
// usage example
<Ionicons name={"md-remove"} size={24} color={"white"} />;
```

If we want to use custom fonts we need to install `@expo-font` package, this package exposes `useFonts` hook to load custom fonts.

```js
import { useFonts } from "expo-font";

// loading custom fonts
useFonts({
  "open-sans": require("./assets/fonts/OpenSans-Regular.ttf"),
  "open-sans-bold": require("./assets/fonts/OpenSans-Bold.ttf"),
});
```

Loading these fonts might take sometime so it would be a nice UX to show loading screen while loading is in effect. For this we can install another expo package `expo install expo-app-loading`. This package alows us to prolong splash screen until some condition is met.

```js
import AppLoading from "expo-app-loading";
import { useFonts } from "expo-font";

export default function App() {
  const [fontsLoaded] = useFonts({
    "open-sans": require("./assets/fonts/OpenSans-Regular.ttf"),
    "open-sans-bold": require("./assets/fonts/OpenSans-Bold.ttf"),
  });

  if (!fontsLoaded) return <AppLoading />;

  return <View sstyle={styles.root}></View>;
}

const styles = StyleSheet.create({
  root: {
    fontFamily: "open-sans",
  },
});
```

### Nested Text

Text component doesn't allow View as child but it allows other Text components, and it also applies styles from parent Text to it!

## Adaptive User Interfaces

### Dimensions API

`Dimensions` is javascript object which we can use anywhere to get information out if it. To get informations we would use `get` method which takes `screen` or `window` as an argument.
On iOS there is no difference between these two options, however on Android screen is entire** available **width and height including status bar, while window is usable part of the screen (excluding status bar).

```js
import { Dimensions, StyleSheet } from 'react-native';

const deviceWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    padding: deviceWidth < 450 ? 12 : 24;
  }
})
```

One thing to Note is that if we use Dimensions API like this we cannot react to size changes of the device, when for example user changes orientation.
For reactive tracking of device dimension changes RN provides `useWindowDimensions` hook which we can use inside of our components

```js
const Component = () => {
  const { width, height } = useWindowDimensions();
  const margin = width < 380 ? 12 : 24;

  return <View sstyle={[styles.view, { margin }]} />;
};
```

### KeyboardAvoidingView

RN exposes KeyboardAvoidingView component to help us deal with situations when keyboard is making our UI inaccessible. One thing we might need to add on top of it is ScrollView component, example:

```js
const Component = () => {
  return (
    <ScrollView sstyle={styles.flex1}>
      <KeyboardAvoidingView sstyle={styles.flex1} behavior={"position"}>
        <Text>Content</Text>
      </KeyboardAvoidingView>
    </ScrollView>
  );
};
```

### Platform API

Platform API works similarly to Dimensions API expect it doesn't have listener hook, since its not really needed, platform is not going to change during the runtime.

One way of using it might be following:

```js
borderWidth: Platform.OS === "android" ? 2 : 0;
```

There is also alternative and maybe better approach:

```js
borderWidth: Platform.select({
  ios: 0,
  android: 2,
});
```

You can also have platform specific files but you need to respect following naming convention `[file-name].[platform].js` example would be `Title.android.js`.
When importing such files you just use file name, RN will pick appropriate file depending on the platform.

## Navigation

### React Navigation

For navigation we can use package called React Navigation `npm i @react-navigation/native`. For integration with Expo we need two more dependencies `expo install react-native-screens react-native-safe-area-context`.
This package is component based, which means that it exposes a set of components to help us deal with navigation in RN. First thing is to wrap our App component content with `NavigationContainer`. This on its own won't do anything, for navigation we need to use Navigators which we need to install separately.

Example below shows Stack navigator in action. First we create Stack by running `createNativeStackNavigator`, Stack exposes two components `Navigator` and `Screen`. Screen component is used to register our screen, it takes name and component. Name is screen identifier which we can use to jump to that screen later, and component is our screen component, note that it's not JSX element but a **function pointer**.

By default first screen registered as a Navigator child will be default screen shown when the app starts, in example below it is _MealsCategories_ screen. You can change initial screen by changing order or you can define `initialRouteName` prop on navigator component.

```js
import { NavigatorContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer initialRouteName={"MealsCategories"}>
      <Stack.Navigator>
        <Stack.Screen
          name={"MealsCategories"}
          component={MealsCategoriesComponent}
        />
        <Stack.Screen
          name={"MealsOverview"}
          component={MealsOverviewComponent}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

On components we pass to `Stack.Screen` we get an additional `navigation` object prop which we can use for navigation between screens, using its `navigate` function.

```js
export default function MealsCategoriesComponent({ navigation }) {
  const pressHandler = () => {
    navigation.navigate("MealsOverview");
  };

  return (
    <View>
      <Pressable onPress={pressHandler}>
        <Text>MealsCategoriesComponent works</Text>
      </Pressable>
    </View>
  );
}
```

If you need navigation in some nested component you can use `useNavigation` hook from RN

```js
import { useNavigation } from "@react-navigation/native";

export default function MealsCategoriesComponent() {
  const navigation = useNavigation();
  const pressHandler = () => {
    navigation.navigate("MealsOverview");
  };

  return (
    <View>
      <Pressable onPress={pressHandler}>
        <Text>MealsCategoriesComponent works</Text>
      </Pressable>
    </View>
  );
}
```

We can send data while navigating from one screen to another by defining second argument of navigate function, like this:

```js
navigation.navigate("MealsOverview", {
  categoryId: item.id,
});
```

Another prop that you get besides `navigation` once you register screen in Navigator is `route` which you can use to extract params passed through navigation. Also there's a hook for this called `useRoute`.

```js
import { useRoute } from "@react-navigation/native";

function MealsCategoriesComponent({ navigation, route }) {
  const categoryId = route.params.categoryId;

  // ...
}

function MealsCategoriesComponent() {
  const route = useRoute();
  const categoryId = route.params.categoryId;

  // ...
}
```

### Navigation header

You can control how Navigator header looks through options `Screen` component provides, for example you can add custom button to header component:

```js
<Stack.Screen
  name={"screen"}
  component={Screen}
  options={{
    headerRight: () => {
      return <Button title={"Custom Action"} />;
    },
  }}
/>
```

If you want this button to interact with screen, you need to define it within screen component.

```js
const Screen = ({ navigation }) => {
  const handlerButtonPressed = () => {
    // do something
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => {
        return (
          <Button title={"Custom Action"} onPress={handlerButtonPressed} />
        );
      },
    });
  }, [navigation, handlerButtonPressed]);

  // ...
};
```

### Other Navigators

React Navigation offesr many other pre-built navigators like: Drawer, Bottom Tabs, Top Tabs, ...etc. To use them you need to install their dedicated package.
Example bellow show how Drawer Navigator works, its pretty much similar to Stack Navigator we looked before.

```js
const Drawer = createDrawerNavigator();

const App = () => {
  return (
    <NavigatorContainer>
      <Drawer.Navigator>
        <Drawer.Screen name={"screen"} component={Screen} />
      </Drawer.Navigator>
    </NavigatorContainer>
  );
};
```

### Nesting Navigators

React Navigation allows you to combine multiple navigators in your App, for example on root level you might have Drawer Navigator and on some screen you can have Tab or Stack navigator.

```js
const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator>
      <Drawer.Screen name={"drawer-screen"} component={Screen} />
    </Drawer.Navigator>
  );
};
const App = () => {
  return (
    <NavigatorContainer>
      <Stack.Navigator>
        <Stack.Screen name={"drawer"} component={DrawerNavigator} />
      </Stack.Navigator>
    </NavigatorContainer>
  );
};
```

Note when nesting navigators, each navigator brings its own header. To get rid of extra header and set some styling we need to set up some options. Both Navigator and Screen components take options, Screen options only apply to that specific screen, while Navigator options apply to all child screens.

```js
const App = () => {
  return (
    <NavigatorContainer>
      <Stack.Navigator>
        <Stack.Screen
          name={"drawer"}
          component={DrawerNavigator}
          options={{
            headerShown: false, // disable Stack Navigator header for this screen
          }}
        />
      </Stack.Navigator>
    </NavigatorContainer>
  );
};
```

## Redux State Manager

First we need to create Redux store by calling `configureStore` from RTK. And wrap our application with `Provider` from Redux, not RTK, and pass our store to it.

```js
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

const store = configureStore({
  reducer: {},
});

export const App = () => {
  return <Provider store={store}></Provider>;
};
```

To create a slice we use `createSlice` from RTK. We should pass configuration object to this function with name as slice identifier, initial state and reducers which are actions that can change state. Redux use to require state to be immutable, but RTK takes care of it under the hood so that you can freely mutate the state.

```js
// slice.js
const slice = createSlice({
  name: "slice",
  initialState: {
    ids: [],
  },
  reducers: {
    addData: (state, action) => {
      state.data.push(action.payload.id);
    },
    removeData: (state, action) => {
      state.data.splice(state.data.indexOf(action.payload.id));
    },
  },
});

// We need to expose actions
export const addData = slice.actions.addData;
export const removeData = slice.actions.removeData;
// This is what we are going to attach to the store
export default slice.reducer;
```

Now in our `store.js` file

```js
import sliceReducer from "./slice";

const store = configureStore({
  reducer: {
    slice: sliceReducer,
  },
});
```

Now to start using this store we can import `useSelector` hook from Redux.

```js
const ids = useSelector((state) => state.slice.ids);
```

To change data we need to **dispatch** actions which is done with another hook `useDispatch`

```js
const dispatch = useDispatch();
dispatch(addData({ id: 1 }));
dispatch(removeData({ id: 1 }));
```

## Sending HTTP Requests

### Handling Loading

RN already has platform specific loading spinner component called `ActivityIndicator`

```js
import { View, ActivityIndicator } from "react-native";

export const LoadingOverlay = () => {
  return (
    <View>
      <ActivityIndicator size={"large"} color={"white"} />
    </View>
  );
};
```

## Authentication

### Storing and Managing User Access

To hold authentication state we can create React context to wrap our Navigation tree with.

```js
const AuthContext = createContext({
  token: "",
  isAuthenticated: false,
});

export function AuthContextProvider({ children }) {
  const [authToken, setAuthToken] = useState();

  function authenticate(token) {
    setAuthToken(token);
  }
  function logout() {
    setAuthToken(null);
  }

  return (
    <AuthContext.Provider
      value={{
        token: authToken,
        isAuthenticated: !!authToken,
        authenticate,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuthContext() {
  return useContext(AuthContext);
}
```

With such setup we can call `authenticate` and pass it token we received from our backend to authorize user.

### Protecting Screens

Under no circumstances should an un-authorized user access restricted screens. One way of doing this is to create multiple navigations stacks:

```js
function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name={"Login"} component={LoginScreen} />
      <Stack.Screen name={"Signup"} component={SignupScreen} />
    </Stack.Navigator>
  );
}
function AuthenticatedStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name={"Welcome"} component={WelcomeScreen} />
    </Stack.Navigator>
  );
}
function Navigation() {
  const { isAuthenticated } = useAuthContext();
  return (
    <NavigationContainer>
      {isAuthenticated ? <AuthenticatedStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
function App() {
  return (
    <>
      <StatusBar style={"light"} />
      <AuthContextProvider>
        <Navigation />
      </AuthContextProvider>
    </>
  );
}
```

### Storing Auth Tokens on the Device

For storing data on the device we can use 3rd party package `AsyncStorage`. It will store things differently on iOS and Android but will provide the same interface for both.

It works similarly to local storage, so whenever you want to store some value you would need to convert it into string. Difference between local storage is that this storage is **async** which means that works with promises.

```js
import AsyncStorage from "@react-native-async-storage/async-storage";

AsyncStorage.setItem("token", token);

const getToken = async () => {
  return await AsyncStorage.getItem("token");
};
```

We can use this `AsyncStorage` to automatically authenticate user.

It is important to move this process in root of our app to avoid navigation flickering. Navigation flickering will occur because application is initially going to display `LoginScreen` before it realizes that user is authorized.

Even if we move this to root we may want to prolong `SplashScreen` (initial loading screen) of our application for better UX. To do this we can use `expo install expo-app-loading`, rendering this component will tell RN to show `SplashScreen`.

Example of how it should look:

```js
import AppLoading from "expo-app-loading";

const Root = () => {
  const auth = useAuthContext();

  const [isAuthenticating, setIsAuthenticating] = useState(true);

  const getToken = async () => {
    const token = await AsyncStorage.getItem("token");

    if (token) {
      auth.authenticate(token);
    }

    setIsAuthenticating(false);
  };

  useEffect(() => {
    getToken();
  }, []);

  return isAuthenticating ? <AppLoading /> : <AppNavigation />;
};

const App = () => {
  return (
    <>
      <StatusBar style="light" />
      <AuthProvider>
        <Root />
      </AuthProvider>
    </>
  );
};
```

## Native Device Features (Camera, Location & More)

Expo provides React components for all our needs like `expo-camera` or `expo-location`.

### Camera

`expo-camera` this package doesn't just open device camera, it also allows you to customize camera screen, which means that you can build your own camera UI.

If this is too much for you application needs you can go with `image-picker` which provides basic functionalities like accessing your pictures and starting up device camera.

You must register permissions your app requires ahead of time. You need to make following update in `app.json` file to register `image-picker` permission

```json
{
  "plugins": [
    [
      "expo-image-picker",
      { "cameraPermission": "Explain to user why you need it" }
    ]
  ]
}
```

#### Taking Pictures

`launchCameraAsync` function returns a `Promise` because when it opens up device camera it "waits" for user to do something with it.
Result of this function is an object containing usefull properites like `cancelled` and `uri` which points to picture location on users device.

For iOS you need to manage permissions manually, for that you can use `useCameraPermissions` hook provided by `expo-image-picker` library. `requestCameraPermissions` function is asynchronous because it wait for user to decide whether or not to grant permission.

```js
import {
  launchCameraAsync,
  useCameraPermissions,
  PermissionStatus,
} from "expo-image-picker";

export const ImagePicker = () => {
  const [pickedImage, setPickedImage] = useState();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const hasPermissions = async () => {
    switch (cameraPermission.status) {
      case PermissionStatus.UNDETERMINED:
        const permissionResponse = await requestPermission();
        // This depends on user action and can be both true or false;
        return permissionResponse.granted;
      case PermissionStatus.DENIED:
        Alert.alert(
          "Insufficient Permissions!",
          "You need to grant camera permissions to use this feature."
        );
        return false;
      default:
        return true;
    }
  };

  const takeImageHandler = async () => {
    if (!(await hasPermissions())) return;

    const image = await launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.5,
    });

    setPickedImage(image);
  };

  const renderImagePreview = () => {
    if (image.uri) {
      return <Image sstyle={styles.image} source={{ uri: image.uri }} />;
    } else {
      return <Text>Nothing to preview</Text>;
    }
  };

  return (
    <View>
      <View sstyle={styles.imagePreview}>{renderImagePreview()}</View>
      <Button title={"Take Image"} onPress={takeImageHandler} />
    </View>
  );
};

const styles = StyleSheet.create({
  imagePreview: {
    width: "100%",
    height: 200,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
```

### Location

`expo-location` this package doesn't require you to declare permissions in advance, but you still need to ask for a grant on both platforms.

**Note:** In RN when we go back from some screen, screen that we get back to is **not re-created**. Which means that hooks like useEffect are not going to run!
To get around that we can use hook provided by react-navigation called useIsFocused. This hook exposes flag that tells if screen is focused or not.

```js
import {
  getCurrentPositionAsync,
  useForegroundPermissions,
  PermissionStatus,
} from "expo-location";

export const LocationPicker = () => {
  const [pickedLocation, setPickedLocation] = useState();
  const [locationPermission, requestlocationPermission] =
    useForegroundPermissions();
  const isFocused = useIsFocused();
  const navigation = useNavigation();
  const route = useRoute();

  useLayoutEffect(() => {
    if (isFocused && route.location) {
      setPickedLocation(route.location);
    }
  }, [isFocused, route]);

  const hasPermissions = async () => {
    switch (locationPermission.status) {
      case PermissionStatus.UNDETERMINED:
        const permissionResponse = await requestPermission();
        // This depends on user action and can be both true or false;
        return permissionResponse.granted;
      case PermissionStatus.DENIED:
        Alert.alert(
          "Insufficient Permissions!",
          "You need to grant location permissions to use this feature."
        );
        return false;
      default:
        return true;
    }
  };

  const findLocation = async () => {
    if (!(await hasPermissions())) return;

    const location = await getCurrentPositionAsync();
    setPickedLocation({
      lat: location.coords.latitude,
      lng: location.coords.longitude,
    });
  };

  const pickLocation = () => {
    navigation.navigate("Map");
  };

  const renderPickedLocation = () => {
    if (pickedLocation) {
      return <Image source={{ uri: getGoogleMapsImage(pickedLocation) }} />;
    } else {
      return <Text>No location picked yet</Text>;
    }
  };

  return (
    <View>
      <View>{renderPickedLocation()}</View>
      <View>
        <Button title={"Find location"} onPress={findLocation} />
        <Button title={"Pick location"} onPress={pickLocation} />
      </View>
    </View>
  );
};
```

To let user pick its location you can use another expo package `react-native-maps`. This package exposes Map component that will render Google or Apple Maps.

You can use this package immediately in you dev environment, but once you are ready to deploy there are some configuration steps you need to make, online documentation has entire step-by-step blueprint available.

```js
import MapView, { Marker } from "react-native-maps";

export const Map = () => {
  const [location, setLocation] = useState();
  const navigation = useNavigation();

  const selectLocationHandler = (event) => {
    const lat = event.nativeEvent.coordinate.latitude;
    const lng = event.nativeEvent.coordinate.longitude;

    setLocation({ lat, lng });
  };

  const savePickedLocationHandler = useCallback(() => {
    if (!selectedLocation) {
      Alert.alert(
        "No location picked",
        "You have to pick a location (by tapping on screen) first!"
      );
      return;
    }

    navigation.navigate("AddPlace", { location });
  }, []);

  useLayouEffect(() => {
    navigation.setOption({
      headerRight: () => (
        <Button title={"Save"} onPress={savePickedLocationHandler} />
      ),
    });
  }, [navigation, savePickedLocationHandler]);

  return (
    <MapView initialRegion={region} onPress={selectLocationHandler}>
      {location ? (
        <Marker
          title={"Your location"}
          coordinate={{
            latitude: location.lat,
            longitude: location.lng,
          }}
        />
      ) : null}
    </MapView>
  );
};

// Some place you want map to render first,
// delta stands for how much of map is going to be visible.
const region = {
  latitude: 0,
  longitude: 0,
  latitudeDelta: 0,
  longitudeDelta: 0,
};
```

If you ever need to convert location data into human readable address, you can use google maps geocoding API.

```js
const GEOCODE_API = "https://maps.googleapis.com/maps/api/geocode/json?";

export const getAddress = async (lat, lng) => {
  const url = `${GEOCODE_API}latlng=${lat},${lng}&key=${GEOCODE_API_KEY}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Failed to fetch address");
  }

  const data = await res.json();
  const addr = data.results[0].formatted_address;

  return addr;
};
```

## SQLite

If you want to persist data on users device but you don't need dedicated backend to do so, you can `expo-sqlite` package.

Example of working with SQLite package:

```js
// database.js
import * from SQLite from 'expo-sqlite';

const database = SQLite.openDatabase('places.db');

export function initDB() {
  return new Promise((res, rej) => {
    database.transaction((tx) => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS places (
          id INTEGER PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          imageUrl TEXT NOT NULL,
          address TEXT NOT NULL,
          lat REAL NOT NULL,
          lng REAL NOT NULL)`,
        [],
        () => { resolve(); },
        (_, err) => { reject(err); }
      );
    });
  });
}

export function insertPlace(place) {
  return new Promise((res, rej) => {
    database.transaction((tx) => {
      tx.executeSql(
        `INSERT INTO places (title, imageUri, address, lat, lng)
          VALUES (?, ?, ?, ?, ?)`,
        [
          place.title,
          place.imageUri,
          place.address,
          place.location.lat,
          place.location.lng
        ],
        (_, res) => {
          resolve(res.rows._array.map(place => new Place(place)));
        },
        (_, err) => { reject(err); }
      );
    });
  });
}

export function getPlaces(place) {
  return new Promise((res, rej) => {
    database.transaction((tx) => {
      tx.executeSql(
        `SELECT * FROM places`,
        [],
        (_, res) => { resolve(res); },
        (_, err) => { reject(err); }
      );
    });
  });
}
```

```js
// App.js

const App = () => {
  const [databaseReady, setDatabaseReady] = useState(false);

  useEffect(() => {
    initDB()
      .then(() => setDatabaseReady(true))
      .catch((err) => console.err(err));
  }, []);

  if (!databaseReady) {
    return <AppLoading />;
  }

  return <Root />;
};
```

## Publishing RN Apps

There are three main steps to publishing apps: configuring, building and submitting. Publishing Expo app is a bit easier then since you don't have to configure as much, also Expo company has Expo Cloud Service (EAS) that you can leverage to build your app for both platforms.

EAS allows you to:

- build for both platforms
- upload to Apple/Google store through CLI
- push small fixes directly to end-users (CodePush)

### Configuring

Things that you may want to configure for production:

- Permissions
- App Name, Version and Identifier
- Environment Variables
  - Expo has built-in solution for this
- Icons and Splash screen
  - Follow documentation and Expo will build icons with different resolutions on the fly

#### Versioning your app

You use **app.json** to specificy version of your app

- **version** - This is user facing for both platforms.
- **android.versionCode** - Internal for distinguishing binaries, this needs to be positive integer.
  - This is to protect against downgrades by preventing users from installing APK with lower version code.
  - You **cannot upload** an APK to Play store with versionCode you have already used for previous version
  - Must not exceed 2,100,000,000
- **ios.buildNumber** - Internal for distinguishing binaries, this needs to be tring comprised of three non-negative, period separated integers.
  - Can contain suffix to represent stage of development d, a, b and fc (e.g. 0.0.0a1)
  - Must not exceed 255

```json
// app.json

{
  "android": {
    "versionCode": "1"
  },
  "ios": {
    "buildNumber": "1.0.0"
  }
}
```

### Building

- Create Expo account
- Install EAS CLI by running `npm i -g eas-cli`
- Login with `eas login`
- Configure project `eas build:configure`

Before we build for app store we can build for simulators to test if everything works as it should. To accomplish that we need to make some tweaks.

```json
{
  // ...
  "build": {
    // ...
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": true
      }
    }
  }
}
```

Now we can run `eas build -p android --profile preview` to generate APK for Android, or `eas build -p ios --profile preview` for iOS.

This will ask you to specify unique identifier, if its not specified already. Unique identifer should look like reverse URL, for example: `com.companyname.projectname`

If everything goes according to plan you can just do `eas build -p android` to build for production.

## Notifications

### Local Notifications

Notifications that are triggered by the installed app, for the local device.

- Not sent to other users or devices
- Scheduled, delivered and handled on the same device (no server involved)

Easiest way of implementing local notification is by using `expo-notifications`, this package can also be used for push notifications as well.

When using Expo Go, you shouldn't need to ask for any permissions to send or show local notifications. This will change as you build app for production.
To ensure that notifications work correctly, you should ask for permission. For Android no changes are required but for iOS you can use `requestPermissionsAsync`. To get permission status you can use `getPermissionsAsync`

#### Scheduling Notification

To schedule notification we can use `scheduleNotificationAsync` function which takes one argument - an object where you set content and trigger.
Some properties in content are platform specific so you need to take a look at official docs for that.
Trigger property is how we schedule our notification, we can set interal or some date after which notification will appear.

```js
import * as Notifications from "expo-notifications";

function scheduleNotificationHandler() {
  Notifications.scheduleNotificationAsync({
    content: {
      title: "Local notifications",
      body: "This is local notification",
      data: { userId: 0 },
    },
    trigger: {
      seconds: 5,
    },
  });
}
```

With code above we are scheduling notification, but we are not handling them thats why they are not being displayed. To tell underlying platform how notifications should be handled we need to `setNotificationHandler`. We need to do this once when our application starts, so best place to do so would be `App.js`

```js
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowAlert: true,
  }),
});
```

#### Reacting to notifications

Sometimes we need to react to user clicking on notification, for that we need to register some listeners.

```js
const ScheduleNotificationButton = () => {
  useEffect(() => {
    const subscriptions = [];
    // Notification displayed event
    subscriptions.push(
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("NOTIFICATION RECEIVED", notification);
      })
    );
    // Notification interacted with event
    subscriptions.push(
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("INTERACTED WITH NOTIFICATION", response);
      })
    );

    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }, []);

  function scheduleNotificationHandler() {
    Notifications.scheduleNotificationAsync({
      content: {
        title: "Local notifications",
        body: "This is local notification",
        data: { userId: 0 },
      },
      trigger: {
        seconds: 5,
      },
    });
  }

  return (
    <Button
      title={"Schedule notification"}
      onPress={scheduleNotificationHandler}
    />
  );
};
```

### Push notifications

To send push notification to some device whether it is from our backend or from another device we need to use external Push Notification Server provided by Apple and Google.
Expo also provides such server, which is proxy to Apple and Google server under the hood.
One thing to note is that push notifications are only available on real devices.

#### Setup

To send push notifications over Expo server you need ExpoPushToken, this token acts as device identifier. We can retrieve this token once application starts, example:

```js
const requestPermissions = async () => {
  const currentPermissions = await Notifications.getPermissionsAsync();

  if (currentPermissions.status !== "granted") {
    const newPermissions = await Notifications.requestPermissionsAsync();
    throw new Error("Permission not granted");
  }
};

const setupNotifications = async () => {
  const pushTokenData = await Notifications.getExpoPushTokenAsync();

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  return pushTokenData;
};

const configurePushNotifications = () => {
  requestPermissions()
    .catch(() => Alert.alert("Permission required"))
    .then(() => setupNotification);
};

const App = () => {
  useEffect(() => {
    configurePushNotifications();
  }, []);
};
```

There is a Push notification tool by Expo that helps you test push notifications on real device.

We can communicate with Expo push notification server from both frontend and backend, to send push notification to some other device from frontend looks like this:

```js
const expoPushLink = "http://exp.host/--/api/v2/push/send";
function sendPushNotificationHandler() {
  fetch(expoPushLink, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: "EXPO_PUSH_TOKEN",
      title: "Title",
      body: "Body",
    }),
  });
}
```
