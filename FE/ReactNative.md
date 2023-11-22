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
