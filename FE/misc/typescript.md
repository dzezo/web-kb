#### keyof (union of props)

For any type <code>T</code>, <code>keyof T</code> will return **union of publicly available property names**

```ts
interface Person {
  age: number;
  name: string;
}

type PersonKeys = keyof Person; // "age" | "name"
```

#### extends keyof (constrain to union of props)

This is used to constrain the type of generic parameter. For example if we have something like:
<code><T, K extends keyof T></code>
<code>K</code> can only be a **public property name**, it has nothing to do with extending a type or inheritence.

Example:

```ts
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

```ts
const person: Person = {
  age: 22,
  name: "Tobias",
};
const name = getProperty(person, "name"); // no error
const gender = getProperty(person, "gender"); // ERROR: gender is not property of person
```

#### in keyof

<code>in</code> is used when we want to define **index signature** with a union.

```ts
// Index signature, index as string
type A = { [key: string]: string };
// Index signature, index as number
type B = { [key: number]: number };
// Index signature, index as union
type C = "a" | "b" | "c";
type FromC = { [k in C]?: number };

// Notice ? in type FromC
const o1: FromC = { b: 2 };
// Error no property 'd'
const o2: FromC = { d: 2 };
```

now using <code>in</code> in combination with <code>keyof</code> which returns union of properties, we can create mapped type which re-maps all properties of the original type.

Example:

```ts
// Typescript already offers such utility Partial<T>
type Optional<T> = {
  [K in keyof T]?: T[K]
}

const person: Optional<Person> {
  name: "Tobias"
  // we don't have to specify age
  // since age is now mapped from number -> number?
}
```
