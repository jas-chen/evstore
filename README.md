# evstore

> Event based state management library

```js
import React from 'react';
import ReactDOM from 'react-dom';
import evstore from 'evstore';
import { Provider, useContainer, useStore } from 'evstore/react';

const countStore = (container) => ({
  initState: 0,
  updater(setState, getState) {
    container.on('increment', () => setState(getState() + 1));
    container.on('decrement', () => setState((state) => state - 1));
  },
});

const store = evstore.create({
  count: countStore,
});

const Counter = () => {
  const container = useContainer();
  const count = useStore(container, 'count');

  return (
    <>
      <button onClick={() => container.emit('increment')}>+</button>
      {count}
      <button onClick={() => container.emit('decrement')}>-</button>
    </>
  );
};

const App = () => (
  <Provider value={store}>
    <Counter />
  </Provider>
);

ReactDOM.render(<App />, document.getElementById('root'));
```
