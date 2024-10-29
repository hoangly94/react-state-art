import React from 'react';
import { createStore } from 'react-state-art';

const Counter = () => {
  const { count, increase } = useCounterStore();
  return (
    <div>
      <button onClick={increase}>Increase</button>
      <div>Count: {count}</div>
      <div>Double Count: {doubleCount}</div>
    </div>
  );
};

export default Counter;

export const { useCounterStore } = createStore({
  name: 'counter',
  state: {
    count: 0,
  },
  actions: {
    increase() {
      this.count++;
    },
  },
  getters: {
    doubleCount() {
      return this.count * 2;
    },
  },
});
