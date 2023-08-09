# Microfrontends

What are MFEs:

- Divide a monolithic app into multiple, smaller apps
- Each smaller app is responsible for a distinct feature of the product

Why use them:

- Multiple engineering teams can work in isolation
- Each smaller app is easier to understand and make changes to

Whenever we have multiple MFE application we need to also have one more application that governs over these applications called **Container**. Container app decides how and when these MFE apps are shown.

In order for container to accomplish its task it needs access to source code of those MFE. This entire proccess is reffered to as **integration**.

There is no single perfect solution to integration, each have pros and cons. Generally there are three different categories of integration:

- Built-Time Integration (Compile-Time Integration)
  **Before** Container gets loaded in the browser, it gets access to source code.
  Implementaion: Publish MFE app as package, then install it as dependency in Container app.
  - Pros: easy to setup and understand
  - Cons: Container has to be re-deployed every time something is updated
- Run-Time Integration (Client-Side Integration)
  **After** Container gets loaded in the browser, it gets access to source code.
  Implementation: Bundle and deploy MFE app to some static url `https://my-app.com/cart.js`. Whenever user navigates to `https://my-app.com` Container app is loaded, then Container app fetches cart.js and executes it. In this approach Container only has access to source code after it has been loaded into browser.
  - Pros:
    - MFE can be deployed independently at any time
    - There can be multiple live versions of MFE app, and Container can decide which one to use, can be useful in AB testing.
  - Cons: Tooling and setup is far more complicated
- Server Integration
  While sending down JS to load up Container, a server decides on whether or not to include source code

## Basics of Webpack

Webpack is used to bundle all of our js files into one. To bundle files use `webpack` command, after its done dist folder will appear with main.js file which contains all code from our application.

To make webpack output available to browser we can use **Webpack Dev Server** in our webpack.config.js file we need to specify:

```js
module.exports = {
  mode: "development",
  devServer: {
    port: 8081,
  },
};
```

To run server we use `webpack serve` command.

Webpack can produce multiple bundles after compilation and it can become difficult to include them all as script tags in our index.html file. To remedy this issue we can use **html-wepback-plugin**. we need to re-configure webpack to use it like this:

```js
const HTMLWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",
  devServer: {
    port: 8081,
  },
  plugins: [
    new HTMLWebpackPlugin({
      template: "./public/index.html",
    }),
  ],
};
```

Now after compilation dist folder will include index.html file that has all the necessary script tags

public folder:

```html
<!DOCTYPE html>
<html lang="en">
  <head></head>
  <body></body>
</html>
```

dist folder:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <script defer src="main.js"></script>
  </head>
  <body></body>
</html>
```

## Implementing module federation

Steps:

1. Designate one app as the Host and onne as the Remote
2. In the Remote, decide which module (files) you want to make available to other projects
3. Set up Module Federation plugin to expose those files
4. In the Host, decide which files you want to get from the remote
5. Set up Module Federation plugin to fetch those files
6. In the Host, refactor the entry point to load asynchronously
7. In the Host, import whatever files you need from the remote

### Understanding module federation

#### Module Federation in Remote

When we start webpack with Module Federation plugin we are now creating two sets of files:

1. We are undergoing normal bundling process where we spit out main.js file from our index.js. This means that we can still run app as a standalone

2. Module Federation plugin is causing following output:
   2.1 **remoteEntry.js** - Contains list of files that are available from this project + directions on how to load them
   2.2 **src_index.js** - Version of src/index.js that can be safely loaded into the browser
   2.3 **faker.js** - Version of faker that can be safely loaded into the browser (this is some random project dependency)

#### Module Federation plugin in Container (Host)

In Host application our src directory contains two files: index.js and bootstrap.js

```js
// index.js
import("./bootstrap");
```

```js
// bootstrap.js
import "products/ProductsIndex";
```

##### What is this index.js file, and why does it have dynamic import?

When we run webpack on Host we are going to get two files out **main.js** (contains all contents from index.js) and **bootstrap.js**

What is happening when we start webpack dev server:

1. main.js gets loaded and executed
2. loads and executes bootstrap.js
3. bootstrap.js needs a file from products! fetch remoteEntry.js to figure how to fetch products
4. Ah, ok, we need src_index and that needs faker.js
5. Ok, got them both, fetch and execute bootstrap.js

##### Understanding Configuration Options

container/webpack.config.js

```js
new ModuleFederationPlugin({
  // Not used, added for clarity. Only needed for Remotes
  name: "container",
  // List of projects that Container can search to get additional code
  remotes: {
    // Load the file at listed URL if anything in Container has import like:
    // import * from 'products';
    // this 'products' has to be key of remotes!!!
    // URL is created like:
    // "[name in Products webpack config file]@[URL for the remoteEntry file]"
    products: "products@http://localhost:8081/remoteEntry.js",
  },
}),
```

products/webpack.config.js

```js
new ModuleFederationPlugin({
  // This property is important since it is used in URL for Container remotes
  name: "products",
  // Sets name of the manifest file.
  // Should be remoteEntry.js unless there is a good reason to change it
  filename: "remoteEntry.js",
  exposes: {
    // Aliases filenames
    // If anyone imports ./ProductIndex we're going to give ./src/index file
    "./ProductsIndex": "./src/index",
  },
}),
```

### Sharing dependencies between apps

In our little example project with products and carts, both MFE apps had faker dependency and when loaded by Container they both load their own copy of faker. This is not great because size of that dependency can be quite large 2.9MB in case of faker.

To solve this issue we need add following line to our Remote projects:

```js
new ModuleFederationPlugin({
  name: "cart",
  filename: "remoteEntry.js",
  exposes: {
    "./CartShow": "./src/index",
  },
  shared: ["faker"], // This is the line we added
}),
```

Container is going to see that we are trying to share faker module, and it is going to load only one copy of this.

When we mark module (faker) as shared that causes it do be loaded **async** by default, which is going to crash Remote app. That's because we are using dependancy (faker) right away in our Remote apps.
`Uncaught Error: Shared module is not available for eager consumption`

This is going to work fine in Container app because we're first loading remoteEntry.js that is going to load dependecies (faker) before it runs src/index

To fix this issue we need to import shared module asynchronously with dynamic import, since it doesn't exist in load time (create bootstrap.js for Remote apps).

**Q:** What happens if two Remote apps have same dependancy, lets say faker, but they rely on different versions of that library
**A:** Module Federation plugin is going to recognize that versions are different from package.json and import them both, which is desirable.
Versions in package.json are important as well as special characters infront of them like ^ or ~ which means that ^5.0.0 and ^5.1.0 are going to be treated the same and only one will be imported.

#### Singleton loading

Some libraries can't be imported multiple times because it would crash the entire app. Solutions for that is:

```js
new ModuleFederationPlugin({
  name: "cart",
  filename: "remoteEntry.js",
  exposes: {
    "./CartShow": "./src/index",
  },
  shared: {
    faker: {
      // This is ensures that only one gets importend no matter what
      singleton: true,
    }
  }
}),
```

When shared lib is defined like this and you try to import two different versions, MFP plugin will import one and give you warning console message.

### Funny Gotcha

Whenever remoteEntry.js is loaded for some Remote, global variable gets created with name specified on name property, example `cart`.

So when we type cart in console it will return object, and that's okay. Problem occurs when we have HTML element with same id:

```html
<div id="cart"></div>
```

This will cause conflict! Because browser will create global variable whenever it encounters element with id, so now when you type cart in console it will return HTML element instead of object.
When Webpack tries to use cart variable it will get HTML element instead which of course will cause an error.

## Requirements That Drive Architecture Choices

**Inflexible Requirements** - We must satisfy these requirements

- Zero coupling between child apps
  - No importing of functions/objects/classes from other child apps
  - No shared state
  - Shared libs through MF is ok
- Near-zero coupling between container and child apps
  - Container shouldn't assume that a child is using a particular framework
  - Any necessary communication done with callbacks or simple events
- CSS from one app shouldn't affect another
- Version control (monorepo vs separate) shouldn't have any impact on the overall project
- Container should be able to decide to always use the latest version of a microfrontend or specify a specific version
  - Container will always use latest version of child app (doesn't require a redeploy of container)
  - Contaier can specify exactly what version of child app it wants to use (requires a redeploy to change)

### Initial webpack config

We are going to create a couple of webpack config files:

- webpack.common.js - config common for both dev and prod
- webpack.prod.js
- webpack.dev.js

Example bellow is common config for Container app, Remote apps have very similar config file:

```js
// webpack.common.js
const HTMLWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  module: {
    rules: [
      {
        // Whenever we import file that ends with .mjs or just .js, we want to run babel loader
        test: /\.m?js$/,
        // We don't want to run babel on all files inside node_modules
        exclude: /node_modules/,
        use: {
          // We are defining loader to process a file before adding it to our projec
          // Babel is going to take our code and make sure it is compatible with all browsers
          loader: "babel-loader",
          options: {
            // preset-react is going to take JSX and turn it into normal JS function calls
            // preset-env is going to take all the latest JS code and make sure it is compatible with all browsers
            presets: ["@babel/preset-react", "@babel/preset-env"],
            // This is going to help us with async code
            plugins: ["@babel/plugin-transform-runtime"],
          },
        },
      },
    ],
  },
  plugins: [
    // For Container app HTML plugin is common since we always want to generate HTML file
    // For Remote apps HTML file is only used during development
    new HTMLWebpackPlugin({
      template: "./public/index.html",
    }),
  ],
};
```

Things to look at in following config implementation is:

- Merge function from webpack-merge that allows us to merge two webpack configs, this reduces repeating of code.
- Importing of package.json file. This import is shortcut for declaring shared libraries. If we want to share specific versions than this solution would not work.

Remote apps dev config file:

```js
// webpack.dev.js
const { merge } = require("webpack-merge");
const HTMLWebpackPlugin = require("html-webpack-plugin");
const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");
const commonConfig = require("./webpack.common");
const packageJson = require("../package.json");

const devConfig = {
  mode: "development",
  devServer: {
    port: 8081,
    historyApiFallback: {
      index: "index.html",
    },
  },
  plugins: [
    new ModuleFederationPlugin({
      name: "marketing",
      filename: "remoteEntry.js",
      exposes: {
        "./MarketingApp": "./src/bootstrap",
      },
      shared: packageJson.dependencies,
    }),
    new HTMLWebpackPlugin({
      template: "./public/index.html",
    }),
  ],
};

module.exports = merge(commonConfig, devConfig);
```

Container app dev config file:

```js
// webpack.dev.js
const { merge } = require("webpack-merge");
const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");
const commonConfig = require("./webpack.common");
const packageJson = require("../package.json");

const devConfig = {
  mode: "development",
  devServer: {
    port: 8080,
    historyApiFallback: {
      index: "index.html",
    },
  },
  plugins: [
    new ModuleFederationPlugin({
      name: "container",
      remotes: {
        marketing: "marketing@http://localhost:8081/remoteEntry.js",
      },
      shared: packageJson.dependencies,
    }),
  ],
};

module.exports = merge(commonConfig, devConfig);
```

Container app production config file:

```js
// webpack.prod.js
const { merge } = require("webpack-merge");
const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");
const commonConfig = require("./webpack.common");
const packageJson = require("../package.json");

const domain = process.env.PRODUCTION_DOMAIN;

const prodConfig = {
  // This mode minifies JS files, aslo changes NODE_ENV to production
  mode: "production",
  output: {
    // When files are built for production, this is naming template they're going to use
    // [name] is the name of the file, [contenthash] is unique and is done for caching issues
    filename: "[name].[contenthash].js",
    // This option is used when some part of webpack tries to refer to a file built by webpack
    // Example: HTML plugin, when it tries to refer to a JS file, it's going to prepend publicPath to filename
    // This is where files are going to be located on S3
    publicPath: "/container/latest/",
  },
  plugins: [
    new ModuleFederationPlugin({
      name: "container",
      remotes: {
        marketing: `marketing@${domain}/marketing/remoteEntry.js`,
      },
      shared: packageJson.dependencies,
    }),
  ],
};

// It's important to have commonConfig first, so that prodConfig can override it
module.exports = merge(commonConfig, prodConfig);
```

Production config file for Remotes is almost identical, only difference is ModuleFederationPlugin configuration.

### Generic Ties Between Projects

Lets say that our Container app is implemented with React and our Remote (MarketingApp) is also implemented with React, then why would we want to do this:

```js
// MarketingApp.js
import React, { useRef, useEffect } from "react";
import { mount } from "marketing/MarketingApp";

export default () => {
  const ref = useRef(null);

  useEffect(() => {
    mount(ref.current);
  }, []);

  return <div ref={ref} />;
};
```

We can simply expose MarketingApp as React component and simply use it, right?

Well we can but there is this inflexible requirement rule: _Container shouldn't assume that a child is using a particular framework_.

Lets say that in the future we decide to change MarketingApp to Angular then we would have to change code in both applications. This goes in other direction as well, so we need to figure out a generic way to deal with this.

Solution in example above is to expose **mount** function that takes HTML element in which Remote app is going to be rendered.

### Implementing CI/CD pipeline

Deployment requirements

1. Want to deploy each microfrontend independently (including Container)
2. Location of child app remoteEntry.js files must be known at build time!
3. Many FE deployment solutions (Heroku, Vercel...) assume you are deploying single project - we need something that can handle multiple projects
4. Probably need CI/CD pipeline
5. At present, the remoteEntry.js file name is fixed! Need to think about caching issues

#### AWS Deployment

Github action for deploying container to S3 bucket

```yaml
name: deploy-container

on:
  push:
    branches:
      - master
    paths:
      - "container/**"

defaults:
  run:
    working-directory: container

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      # This action checks out repo contents into the GitHub Actions runner
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run build
        # CDN domain, used in webpack prod config
        env:
          PRODUCTION_DOMAIN: ${{ secrets.PRODUCTION_DOMAIN }}

      # This action gives us access to aws-cli
      - uses: shinyinc/action-aws-cli@v1.2
      - run: aws s3 sync dist s3://${{ secrets.AWS_S3_BUCKET_NAME }}/container/latest
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_DEFAULT_REGION: "eu-central-1"
      - run: aws cloudfront create-invalidation --distribution-id ${{ secrets.AWS_DISTRIBUTION_ID }} --paths "/container/latest/index.html"
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_DEFAULT_REGION: us-east-2
```

##### Amazon S3

1. Go to AWS Management Console and use the search bar to find S3
2. Click Create Bucket
3. Specify an AWS Region
4. Provide unique Bucket Name and click Create Bucket
5. Click the new Bucket you have created from the Bucket list.
6. Select Properties
7. Scroll down to Static website hosting and click Edit
8. Change to Enable
9. Enter index.html in the Index document field
10. Click Save changes
11. Select Permissions
12. Click Edit in Block all public access
13. Untick the Block all public access box.
14. Click Save changes
15. Type confirm in the field and click Confirm
16. Find the Bucket Policy and click Edit
17. Click Policy generator
18. Change Policy type to S3 Bucket Policy
19. Set Principle to \*
20. Set Action to Get Object
21. Copy the S3 bucket ARN to add to the ARN field and add /_ to the end.
    eg: arn:aws:s3:::mfe-dashboard/_
22. Click Add Statement
23. Click Generate Policy
24. Copy paste the generated policy text to the Policy editor
25. Click Save changes

##### Amazon CloudFront (CDN)

1. Go to AWS Management Console and use the search bar to find CloudFront
2. Click Create distribution
3. Set Origin domain to your S3 bucket
4. Find the Default cache behavior section and change Viewer protocol policy to Redirect HTTP to HTTPS
5. Scroll down and click Create Distribution
6. After Distribution creation has finalized click the Distribution from the list, find its Settings and click Edit
7. Scroll down to find the Default root object field and enter /container/latest/index.html
8. Click Save changes
9. Click Error pages
10. Click Create custom error response
11. Change HTTP error code to 403: Forbidden
12. Change Customize error response to Yes
13. Set Response page path to /container/latest/index.html
14. Set HTTP Response Code to 200: OK

Cloudfront is monitoring your S3 bucket and whenever new file appears it is going to add it to cache, that's why we name our js files for prod as `[name].[contentHash].js`.

But there's one file that is always named the same and it's index.html. Cloudfront doesn't track changed files so any updates to index.html will go unseen.

To fix this we are going to create invalidation, you can do so manually on aws console, or you can do it through aws cli during CI/CD like this:

```yaml
- run: aws cloudfront create-invalidation --distribution-id ${{ secrets.AWS_DISTRIBUTION_ID }} --paths "/container/latest/index.html"
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    AWS_DEFAULT_REGION: us-east-2
```

##### Amazon IAM user

1. Search for "IAM"
2. Click "Create Individual IAM Users" and click "Manage Users"
3. Click "Add User"
4. Enter any name you’d like in the "User Name" field.
5. Click "Next"
6. Click "Attach Policies Directly"
7. Use the search bar to find and tick AmazonS3FullAccess and CloudFrontFullAccess
8. Click "Next"
9. Click "Create user"
10. Select the IAM user that was just created from the list of users
11. Click "Security Credentials"
12. Scroll down to find "Access Keys"
13. Click "Create access key"
14. Select "Command Line Interface (CLI)"
15. Scroll down and tick the "I understand..." check box and click "Next"
16. Copy and/or download the Access Key ID and Secret Access Key to use for deployment.

## Handling CSS in Microfrontends

It's important to scope CSS for each app, otherwise CSS rules can bleed to other MFE apps and ruin styling.

**CSS Scoping Solutions**

- Custom CSS you are writing for your project
  - use CSS-in-JS library
  - use Vue's built-in component style scoping
  - use Angular's built-in component style scoping
  - "Namespace" all your CSS
- CSS coming from component library or CSS library (bootstrap)
  - use component library that does css-in-js
  - manually build css library and apply namespacing techniques to it

Whenever we are using same CSS-in-JS library accross multiple projects, there are some chances that we end up with class name collisions.

That's because these libraries usually modify class names to be shorter when they build for production, and since projects are built seperately same "random" values can appear accross multiple projects and cause problem.

Usually fix for this problem is provided by library, example for material-ui:

```js
import {
  StylesProvider,
  createGenerateClassName,
} from "@material-ui/core/styles";

const generateClassName = createGenerateClassName({
  productionPrefix: "ma",
});

export default () => {
  return (
    <StylesProvider generateClassName={generateClassName}>
      <div></div>
    </StylesProvider>
  );
};
```

material-ui shortens class names to: _jss1, jss2, ...jssN_, with this configuration it will use ma like: _ma1, ma2, ...maN_. This should be done for all projects that use material-ui for styling.

## Implementing Multi-Tier Navigation

Requirements around navigation:

- **Both Container and Individual SubApps need routing features**
  - Users can navigate around to different subapps using routing logic built into Container
  - Users can navigate around in subapp using routing logic built into subapp itself
  - Not all subapps will require routing
- **Subapps might need to add in new pages/routes all the time**
  - New routes added to subapp shouldn't require a redeploy of the container
- **We might need to show two or more microfrontends at the same time**
  - This will occur all the time if we have some kind of sidebar nav that is built as separate microfrontend
- **We want to use off-the-sheld routing solution**
  - Building a routing library can be hard - we don't want to author a new one!
  - Some amount of custom coding is OK
- **We need navigation features for sub-apps in both hosted mode and in isolation**
  - Developing for each environment should be easy - developer should immediately be able to see what path they are visiting
- **If different apps need to communicate information about routing, it should be done in as generic fashion as possible**
  - Each app might be using completely different navigation framework
  - We might swap out or upgrade navigation libs all the time - shouldn't require a rewrite of the rest of the app

### How routing libraries work

Routing libraries decide what content to show on the screen, and they can be thought of as two separate parts:

1. History - Object to get and set the **current path** user is visiting. This object is used by router to figure out current user location.
2. Router - Shows different content based on the **current path**.

#### History object

Routing libraries generaly implement three different kinds of history object.

1. **Browser History** - Look at the path portion (everything after domain) of the URL to figure out what the current path is.
2. **Hash History** - Look at everything after '#' in the URL to figure out the current path
3. **Memory or Abstract History** - Keep track of the current path in memory, since it's stored in code there is no visual indication of what path user is visiting.

#### Setting up navigation in MFE

Different routing libraries are going to be used accross all MFE projects.

- Container router is going to be used to decide which sub-app to show.
- Inside of our Remotes (sub-apps) we are going to have separate routing logic that's concerned with which page to display.

Whenever we create router we need to configure what kind of history it's going to use.
Most common way of setting up navigation in MFE apps is to use Browser Histroy for Container and Memory History for Remotes.

Reason why we don't use Browser History in sub-apps is because that kind of history is changing URL in address bar, so we can end up creating race condition, where two different routing libraries are updating url in their own way.

There is one challenge in using Memory History and that is synchronization between Histories, example:

1. Scenarion #1 - localhost:8080/
   1.1. This sets Browser History to _/_ and Marketing's Memory History is _/_ by default. Marketing Router understands that it needs to show LandingPage and it does, everything works OK.
   1.2. When we click button that navigates to _/pricing_ our app shows correct page, because Marketing's Router understood what it needs to show and all is good.
   **Q:** But our address bar remained the same, why?
   **A:** In this case Memory History changed to _/pricing_ but Browser History remained at _/_ that's why address bar stays the same.
2. Scenario #2 - localhost:8080/pricing
   2.1. This sets Browser History to _/pricing_ and Marketing's Memory History is _/_ by default, **incorrect** LandingPage is shown
   2.2 When we click on pricing link in marketing app, Browser History remains unchanged at _/pricing_, and Memory History updates to _/picing_ showing correct PricingPage.
   2.3. When we click on Home button while on PricingPage Browser History updates to _/_ but Memory History remains at _/pricing_ thus still showing **incorrect** PricingPage even though address bar is at _/_ LandingPage.

To resolve this issue communication between apps needs to be established. Communication needs to be as generic as possible.

##### Communicating through callbacks

```js
// Container MarketingApp.js

export default () => {
  const ref = useRef(null);
  const history = useHistory();

  useEffect(() => {
    // mount now returns history sync callback
    const { onParentNavigate } = mount(ref.current, {
      // When navigation happens in sub-app
      onNavigate: ({ pathname: nextPathname }) => {
        const { pathname } = history.location;

        // Prevent infinite loop
        if (pathname !== nextPathname) {
          history.push(nextPathname);
        }
      },
    });

    // History object has change listener
    // On container history change update sub-app history
    history.listen(onParentNavigate);
  }, []);

  return <div ref={ref} />;
};
```

```js
// Remote - bootstrap.js

const mount = (el, { onNavigate, defaultHistory }) => {
  const history = defaultHistory || createMemoryHistory();
  if (onNavigate) history.listen(onNavigate);

  ReactDOM.render(<App history={history} />, el);

  return {
    onParentNavigate({ pathname: nextPathname }) {
      const { pathname } = history.location;

      // Prevent infinite loop
      if (pathname !== nextPathname) {
        history.push(nextPathname);
      }
    },
  };
};

if (process.env.NODE_ENV === "development") {
  const devRoot = document.querySelector("#_marketing-dev-root");

  if (devRoot) {
    mount(devRoot, {
      // we are going to use browser history in dev
      defaultHistory: createBrowserHistory(),
    });
  }
}
```

#### Deeper dive on PublicPath

We've set `publicPath` property in `webpack.prod.js` config to ensure that when `remoteEntry.js` gets loaded through the Container it knows where to look for files created by webpack.

Goal of publichPath is to make sure that files that have to reference webpack output (remoteEntry) know where to find them.

So far we've only used it in production, but it can be useful even in development.
For example lets say that we have Remote app that lives on `/auth/signup/` route when webpack creates output it will produce `index.html` file because of HTMLWebpackPlugin, and without publicPath property set script tag in this html file would look something like this:

```html
<script src="main.js"></script>
```

Browser will try to load this script by taking **current domain** + **path** + **main.js**, and we would get an error because main.js doesn't exist on that path.

Here we can use `publicPath: "/"` to transform html output into:

```html
<script src="/main.js"></script>
```

This would load script from **localhost:8082/main.js** where it exists

Setting publicPath like this is not going to work when we try to start Container application locally because it would try to find main.js on **localhost:8080/main.js**.

Fix is to set publicPath like this: `publicPath: http://localhost:8082/`

**Q:** Why did it work for MarketingApp and it breaks for AuthApp?
**A:** When we don't specify publicPath, scripts are loaded from URL that we loaded remoteEntry.js from `(where we got remoteEntry.js)/main.js`. Reason why we have issue with AuthApp is because it's located on some nested path like `/auth/signup`

## Authentication in Microfrontends

Notes around authentication

- Auth app is for signing in/up users
- Auth app **is not for** enforcing permissions, allowing access to certain routes, or figuring out if user is signed in
- Two approaches for handling auth
  - Each app is aware of auth
  - Centralize auth in Container
