# evstore

> Event based state management library

```js
import React from 'react';
import ReactDOM from 'react-dom';
import evstore from 'evstore';
import { Provider, useContainer, useStore } from 'evstore-react';

const container = evstore.create();

container.register('count', 0, (setState, getState) => {
  container.on('increment', () => setState(getState() + 1));
  container.on('decrement', () => setState(state => state - 1));
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
}

const App = () => (
  <Provider value={container}>
    <Counter />
  </Provider>
);

ReactDOM.render(<App />, document.getElementById('root'));
```
