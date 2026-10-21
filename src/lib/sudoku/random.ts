export type RandomNumberGenerator = () => number;
export type Seed = number;

export function createMulberry32(seed: Seed): RandomNumberGenerator {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRandomSeed(): Seed {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}

export function shuffleInPlace<Item>(items: Item[], random: RandomNumberGenerator): Item[] {
  for (let index = items.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
}
