# react-state-art

`react-state-art` is a lightweight and powerful state management library for React, inspired by the simplicity and flexibility Vue's Pinia. This library is designed to minimize boilerplate and optimize performance, making state management seamless and efficient in modern React applications.

## ✨ Key Features

- **Minimal Boilerplate**: Streamlined syntax with minimal setup, enabling you to focus on business logic without repetitive code.
- **Optimized Performance**: Uses proxies to automatically subscribe only to the necessary state changes, making your components highly performant.
- **Clear Getter Separation**: Dedicated getters allow for clear separation of computed state, enhancing maintainability and readability.

## 📦 Installation

Install via npm or yarn:

```bash
npm install react-state-art
# or
yarn add react-state-art
```
## 🚀 Quick Start

Define and use a store in just a few lines of code. Here’s a simple example to get you started.

### Example Code

```javascript
import React from 'react';
import { createStore } from 'react-state-art';

// Counter component using the custom store
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
```
### Explanation

- **State**: The `count` state is initialized to `0`.
- **Actions**: `increase` modify the `count` state.
- **Getters**: `doubleCount` is a computed property that returns twice the current `count` value.

## 📖 API Reference

`react-state-art` provides a simple yet powerful API for managing state in your components.

### `createStore(config)`

The `createStore` function is the core utility for defining a store in `react-state-art`.

#### Parameters

- **config.name** (string): A unique name for the store.
- **config.state** (object): An object representing the initial state.
- **config.actions** (object): Functions that mutate the state directly, providing an intuitive way to manage state changes.
- **config.getters** (object): Computed values based on the state, offering a clear and organized method for derived data.

### Usage in Components

The store created with `createStore` can be used directly within components using the returned `useStore` hook.

```javascript
const { someState, someAction } = useYourStore();
```
