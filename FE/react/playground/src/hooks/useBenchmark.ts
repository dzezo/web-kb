const ARR_LEN = 500_000;

export const useBanchmark = () => {
  const arr = new Array(ARR_LEN).fill(1);

  console.time("spread");
  const a = arr.reduce(
    (acc, el) => ({
      ...acc,
      el,
    }),
    {}
  );
  console.timeEnd("spread");

  console.time("index");
  const b = arr.reduce((acc, el) => {
    acc[el] = el;
    return acc;
  }, {});
  console.timeEnd("index");
};
