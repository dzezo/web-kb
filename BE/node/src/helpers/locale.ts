const locales = {
  en_us: {
    hello: "Hi",
    greetings: {
      morning: "Good morning",
      evening: "Good evening",
    },
  },
};

type LocaleMap = typeof locales;
type LocaleName = keyof LocaleMap;
type Locale = LocaleMap[LocaleName];

const currentLocale: LocaleName = "en_us";

type LocalePath<T extends Record<string, any>> = keyof {
  [K in keyof T as T[K] extends string
    ? K
    : T[K] extends Record<string, any>
    ? `${K & string}.${LocalePath<T[K]> & string}`
    : never]: any;
};

function get(object: Record<string, unknown>, path: Array<string>): string {
  const key = path[0];

  if (key === undefined) return "";

  const result = object[key];
  if (result === undefined) return "";

  if (typeof result === "string") return result;

  return get(Object(result), path.slice(1));
}

export function t(key: LocalePath<Locale>): string {
  return get(locales[currentLocale], key.split("."));
}

t("greetings.morning");
