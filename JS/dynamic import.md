# import()

This is commonly called **dynamic import** because it allows loading of script module asynchronously and dynamically. Unlike declartation-style counterpart, these are only evaluated when needed.

import() call resembles function call, but import is a keyword, not a function so you cant do something like `cosnt myImport = import`

```js
import(moduleName);
```

`moduleName` is module to import from, and return value is a promise which fulfills into object containing all exports from `moduleName`

The following are some reasons why you might need to use dynamic import:

- Importing statically significantly slows the loading of your code, and there is low likelihood that you will need to code you are importing, or you will not need it until later time **(lazy loading)**

- When importing significantly increases memory useage and there is low likelihood that you will need the code you are importing

- When module you are importing does not exist in load time

- When the import specifier string needs to be constructed dynamically

- When module you are importing has some side effects, and you don't want them unless some condition is met

- When you are in a non-module environment like `eval`
