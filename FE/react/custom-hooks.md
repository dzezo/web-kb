## useLocalStorage

Hook that is storing data in local storage, and works like react useState hook.

```ts
import { useState, useEffect } from "react";

// useState hook is taking function which gets value from localStorage
export default function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const saved = JSON.parse(localStorage.getItem(key));
    return saved
      ? saved
      : initialValue instanceof Function // because useState can take func
      ? initialValue()
      : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [value]);

  return [value, setValue];
}
```

## useToggle

Small utility hook that makes working with toggle buttons easier

```tsx
import { useState } from 'react'

export default function useToggle(defaultValue) {
	const [value, setValue] = useState(defaultValue)

	function toggleValue(value) {
		setValue(currentValue => (
			typeof value === 'boolean' ? value : !currentValue
		))
	}

    // if you return as an array you can then name them however you want
    // just like you would with React.useState
	return [value, toggleValue]
}

// Example of usage
export default ToggleComponent() {
	const [value, toggleValue] = useToggle(false)

	return (
		<button onClick={toggleValue}>Toggle</button>
		<button onClick={toggleValue(true)}>Make true</button>
		<button onClick={toggleValue(false)}>Make false</button>
	)
}
```

## useTimeout

```tsx
import { useCallback, useEffect, useRef } from 'react'

export default function useTimeout(callback, delay) {
	// Ref to function we want to execute
	const callbackRef = useRef(callback)

	// Blank Ref
	const timeoutRef = useRef()

	useEffect(() => {
		callbackRef.current = callback
	}, [callback])

	const set = useCallback(() => {
		// ref value is stored in .current property
		// here we are setting timeout ref and setting timeout it self
		// to execute callbackRef function after delay
		// this set function should get rebuilt only if delay changes
		timeoutRef.current = setTimeout(() => callbackRef.current(), delay)
	}, [delay])

	const clear = useCallback(() => {
		timeoutRef.current && clearTimeout(timeoutRef.current)
	}, [])

	// This one starts it all
	// If delay, set or clear changes it will set timeoutRef
	// and clear timeoutRef
	useEffect(() => {
		set()

		// Effect can return optional cleanup mechanism that is going
		// to be executed after it.
		// It will clear previous effects
		return clear
	}, [delay, set, clear])

	const reset = useCallback(() => {
		clear()
		set()
	}, [clear, set])

	return {reset, clear}
}

// Example of usage
export default function TimeoutComponent() {
	const [count, setCount] = useState(10)
	const {clear, reset} = useTimeout(() => setCount(0), 1000)

	return (
		<button onClick={() => setCount(c => c + 1)}>Increment</button>
		<button onClick={clear}>Increment</button>
		<button onClick={reset}>Increment</button>
	)
}
```

## useDebounce

Run something after certain delay

```tsx
export default function useDebounce(callback, delay, dependencies) {
  const { reset, clear } = useTimeout(callback, delay);

  // this will run timeout reset anytime dependencies change
  useEffect(reset, [...dependencies, reset]);

  // we don't want timeout on first load
  useEffect(clear, []);
}

// Usage example
export default function DebounceComponent() {
  const [count, setCount] = useState(10);
  useDebounce(() => alert(count), 1000, [count]);

  return <button onClick={() => setCount((c) => c + 1)}>Increment</button>;
}
```

## useUpdateEffect

Update only when something change and don't run on first load, so basically this is useEffect hook except that it doesn't execute provided callback on mount

```tsx
export default function useUpdateEffect(callback, dependencies) {
	const firstRenderRef = useRef(true)

	useEffect(() => {
		if (firstRenderRef.current) {
			firstRenderRef.current = false
			return
		}

		return callback()
	}, dependencies)
}

// Usage example
export default function UpdateEffectComponent() {
	const [count. setCount] = useState(10)

	// If we would to use useEffect hook, this alert would trigger
	// because useEffect runs on mount
	useUpdateEffect(() => alert(count), [count])

	return <button onClick={() => setCount(c => c+1)}>Increment</button>
}

```

## useArray hook

```ts
function useArray(defaultValue) {
	const [array, setArray] = useState(defaultValue)

	function push(element) {
		setArray(a => [...a, element])
	}

	function filter(callback) {
		setArray(a => a.filter(callback))
	}

	function update(index, newElement) {
		setArray(a => [
			...a.slice(0, index),
			newElement,
			...a.slice(index + 1, a.length - 1)
		])
	}

	function remove(index) {
		setArray(a => [...a.slice(0, index), ...a.slice(index+1)]
	}

	function clear() {
		setArray([])
	}

	return {
		array,
		set: setArray,
		push,
		filter,
		update,
		remove,
		clear
	}
}

// Usage example
function ArrayComponent() {
	const {array, set, push, remove, filter, update, clear} = useArray([
		1, 2, 3, 4, 5, 6,
	])

	return (
		<button onClick={() => push(7)}>Add 7</button>
		<button onClick={() => update(1, 9)}>Change 2nd to 9</button>
		<button onClick={() => remove(1)}>Remove 2nd</button>
		<button onClick={() => filter(n => n < 4)}>Keep nums < 4</button>
		<button onClick={() => set([1, 2])}>Set to [1, 2]</button>
		<button onClick={clear}>Clear</button>
	)
}
```

## usePrevious

holds previous state value

```ts
function usePrevious(value) {
  // This will persist for the full lifetime of the component
  // meaning this will not get executed on re-render
  const currentRef = useRef(value);
  const previousRef = useRef();

  if (currentRef.current !== value) {
    previousRef.current = currentRef.current;
    currentRef.current = value;
  }

  return previousRef.current;
}

// Usage example
const [count, setCount] = useState(0);
const previousCount = usePrevious(count);
```

## useStateWithHistory

Hold values that this state had every since it was created,
**_commonly used for undo and redo_**

```ts
export default function useStateWithHistory(value, { capacity = 10 } = {}) {
  const [value, setValue] = useState(value);
  const pointerRef = useRef(0);
  const historyRef = useRef([value]);

  const set = useCallback(
    (v) => {
      const resolvedValue = typeof v === "function" ? v(value) : v;
      if (historyRef.current[pointer.current] !== resolvedValue) {
        // Delete state that is not applicable
        // Case: when you go back and then insert new state
        // That new insert should be last
        if (pointerRef.current < historyRef.current.length - 1) {
          historyRef.current.splice(pointerRef.current + 1);
        }

        // setting last state
        historyRef.current.push(resolvedValue);

        // Cuts off at capacity
        // Removes first elements
        while (historyRef.current.length > capacity) {
          history.current.shift();
        }

        // settign pointer correctly
        pointer.current = history.current.length - 1;
      }

      setValue(resolvedValue);
    },
    [capacity, value]
  );

  function history() {
    return historyRef.current;
  }

  const back = useCallback(() => {
    if (pointerRef.current <= 0) return;
    pointerRef.current--;
    setValue(historyRef.current[pointerRef.current]);
  }, []);

  const forward = useCallback(() => {
    if (pointerRef.current >= historyRef.current.length - 1) return;
    pointerRef.current++;
    setValue(historyRef.current[pointerRef.current]);
  }, []);

  const go = useCallback((index) => {
    if (index < 0 || index >= history.current.length - 1) return;
    pointerRef.current = index;
    setValue(historyRef.current[pointerRef.current]);
  }, []);

  return [value, set, { history, pointer, back, forward, go }];
}

// Example usage

const [count, setCount, { history, pointer, back, forward, go }] =
  useStateWithHistory(1);
```

## useStorage hook

help you persist your state between refreshes
it can be set to work with both local and session storage

```ts
const [name, setName, removeName] = useSessionStorage("name", "Kyle");
const [age, setAge, removeAge] = useLocalStorage("age", 26);

function useStorage(key, defaultValue, storageObject) {
  const [value, setValue] = useState(() => {
    const jsonValue = storageObject.getItem(key);
    if (jsonValue != null) return JSON.parse(jsonValue);

    if (typeof defaultValue === "function") {
      return defaultValue();
    } else {
      return defaulValue;
    }
  });

  useEffect(() => {
    if (value === undefined) return storageObject.removeItem(key);
    storageObject.setItem(key, JSON.stringify(value));
  }, [key, value, storageObject]);

  // this will trigger useEffect hook
  const remove = useCallback(() => {
    setValue(undefined);
  }, []);

  return [value, setValue, remove];
}

export function useLocalStorage(key, defaultValue) {
  return useStorage(key, defaultValue, window.localStorage);
}

export function useSessionStorage(key, defaultValue) {
  return useStorage(key, defaultValue, window.sessionStorage);
}
```

# TODO: Make something with this!!!

## Async hook

```ts
export default function useAsync(callback, dependencies = []) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();
  const [value, setValue] = useState();

  const callbackMemoized = useCallback(() => {
    setLoading(true);
    setError(undefined);
    setValue(undefined);
    callback()
      .then(setValue)
      .catch(setError)
      .finally(() => setLoading(false));
  }, dependencies);

  useEffect(() => {
    callbackMemorized();
  }, [callbackMemorized]);

  return { loading, error, value };
}

// Example of usage
const { loading, error, value } = useAsync(() => {
  return new Promies((resolve, reject) => {
    setTimeout(() => resolve("hi"), 1000);
  });
});
```

## useFetch hook

```ts
export default function useFetch(url, options = {}, dependencies = []) {
  return useAsync(() => {
    return fetch(url, { ...DEFAULT_OPTIONS, ...options }).then((res) => {
      if (res.ok) {
        // .json returns Promise
        // that is what useAsync hook wants
        return res.json();
      } else {
        return res.json().then((json) => Promise.reject(json));
      }
    });
  }, dependencies);
}

const DEFAULT_OPTIONS = {
  headers: { "Content-Type": "application/json" },
};

const { loading, error, value } = useFetch("url", {}, [id]);
```

## useImageLoader

```ts
export const useImageLoader = (
  initialValue: string,
  onSelect?: (data: string) => void
) => {
  const [image, setImage] = useState(initialValue || "");
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    image !== initialValue && setImage(initialValue);
  }, [image, initialValue]);

  const handleLoadFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;

      if (files && files[0]) {
        const reader = new FileReader();
        reader.onload = (loadEvent: ProgressEvent<FileReader>) => {
          if (loadEvent.target && loadEvent.target.result) {
            onSelect && onSelect(loadEvent.target.result.toString());
            setImage(loadEvent.target.result.toString());

            const file = new Image();
            file.onload = () => {
              setSize({
                width: file?.width || 1,
                height: file?.height || 1,
              });
            };
            file.src = URL.createObjectURL(files[0]);
          }
        };

        reader.readAsDataURL(files[0]);
      }
    },
    [onSelect]
  );

  return { handleLoadFile, image, size };
};
```

## useAsyncUpdate

```ts
export enum AsyncUpdateStatus {
  NotStarted,
  Loading,
  Done,
  Error,
}

export const useAsyncUpdate = <T>(
  act: (abort: AbortController) => Promise<T | undefined | void>,
  callback: (data: T | undefined, err?: any) => void,
  deps: DependencyList = []
): [T | undefined, AsyncUpdateStatus] => {
  const [status, setStatus] = useState<AsyncUpdateStatus>(
    AsyncUpdateStatus.NotStarted
  );
  const [data, setData] = useState<T>();

  useEffect(() => {
    const abort = new AbortController();
    setStatus(AsyncUpdateStatus.Loading);
    const runEffect = async () => {
      try {
        setData(undefined);
        const data = await act(abort);
        if (abort.signal.aborted) {
          return callback(undefined, {
            name: "AbortError",
            message: "Aborted",
          });
        }
        setData(data || undefined);
        setStatus(AsyncUpdateStatus.Done);
        callback(data || undefined);
      } catch (err) {
        setStatus(AsyncUpdateStatus.Error);
        callback(undefined, err);
      }
    };
    runEffect().then();

    return () => abort.abort();
  }, deps);

  return [data, status];
};
```

## useQuery

```ts
export const useQuery = <P extends Record<string, unknown>>(
  options?: Parameters<typeof queryString.parse>[1]
): P => {
  const { search } = useLocation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => queryString.parse(search, options) as P, [search]);
};
```
