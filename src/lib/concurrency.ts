export function pLimit(n: number) {
  let active = 0;
  const queue: (() => void)[] = [];
  const next = () => {
    active--;
    const r = queue.shift();
    if (r) r();
  };
  return <T,>(fn: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const run = () => {
        active++;
        fn().then(resolve, reject).finally(next);
      };
      if (active < n) run();
      else queue.push(run);
    });
}
