# evstore [![npm version](https://img.shields.io/npm/v/@jas-chen/evstore.svg?style=flat-square)](https://www.npmjs.com/package/@jas-chen/evstore) [![gzip size](https://img.shields.io/bundlephobia/minzip/@jas-chen/evstore.svg?style=flat-square)](https://bundlephobia.com/result?p=@jas-chen/evstore)

> Event based state management library.

- Framework agnostic
- Code-splittable stores
- One place to update state, makes it easy to debug
- Powered by [mitt](https://github.com/developit/mitt)

## Install
```
yarn add @jas-chen/evstore
```

## Usage

It's an event emitter just like [mitt](https://github.com/developit/mitt)
```
import evstore from '@jas-chen/evstore';

const container = evstore.create();

// listen to an event
container.on('foo', e => console.log('foo', e) )

// listen to all events
container.on('*', (type, e) => console.log(type, e) )

// fire an event
container.emit('foo', { a: 'b' })

// working with handler references:
function onFoo() {}
container.on('foo', onFoo)   // listen
container.off('foo', onFoo)  // unlisten
```

However you can create stores and store values on it
```
container.register('year', 2020);
container.get('year'); // 2020
```

Update and watch a store
```
container.on('time', console.log);

container.register(
  'time',
  new Date(), // initial value
  (setState, getState) => {
    setInterval(() => setState(new Date()), 1000);
  },
);
```

Once a store is registered, it cannot be emited from outside
```
container.emit('time', 12345); // throws an error
```

------

## evstore-react [![npm version](https://img.shields.io/npm/v/@jas-chen/evstore-react.svg?style=flat-square)](https://www.npmjs.com/package/@jas-chen/evstore-react) [![gzip size](https://img.shields.io/bundlephobia/minzip/@jas-chen/evstore-react.svg?style=flat-square)](https://bundlephobia.com/result?p=@jas-chen/evstore-react)

> React binding for @jas-chen/evstore

## Install
```
yarn add @jas-chen/evstore-react
```

#### Counter example
```js
import React from 'react';
import ReactDOM from 'react-dom';
import evstore from '@jas-chen/evstore';
import { Provider, useContainer, useStore } from '@jas-chen/evstore-react';

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

#### Timer example
```
import React from 'react';
import ReactDOM from 'react-dom';
import evstore from '@jas-chen/evstore';
import { Provider, useContainer, useOn } from '@jas-chen/evstore-react';

const container = evstore.create();

setInterval(() => container.emit('tick'), 1000);

const Timer = () => {
  const container = useContainer();
  const [time, setTime] = React.useState(() => new Date().toLocaleString());
  useOn(container, 'tick', () => setTime(new Date().toLocaleString()));

  return time;
}

const App = () => (
  <Provider value={container}>
    <Timer />
  </Provider>
);

ReactDOM.render(<App />, document.getElementById('root'));

```

## License

[MIT License](https://opensource.org/licenses/MIT)
