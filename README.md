[![build status](https://github.com/jas-chen/evstore/workflows/CI/badge.svg)](https://github.com/jas-chen/evstore/actions)

# evstore
[![npm version](https://img.shields.io/npm/v/@jas-chen/evstore.svg?style=flat-square)](https://www.npmjs.com/package/@jas-chen/evstore) [![gzip size](https://img.shields.io/bundlephobia/minzip/@jas-chen/evstore.svg?style=flat-square)](https://bundlephobia.com/result?p=@jas-chen/evstore)

> Event based state management library.

- Framework agnostic
- Code-splittable stores
- One place to update state, makes it easy to debug
- Stores can be freely combined
- Powered by [mitt](https://github.com/developit/mitt)

## Install
```
yarn add @jas-chen/evstore
```

The [UMD](https://github.com/umdjs/umd) build is also available on [unpkg](https://unpkg.com):

```html
<script src="https://unpkg.com/mitt/dist/mitt.umd.js"></script>
<script src="https://unpkg.com/@jas-chen/evstore/dist/evstore.umd.js"></script>
```

You can find the library on `window.evstore`.

## Usage

It's an event emitter just like [mitt](https://github.com/developit/mitt)
```js
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
const unlisten = container.on('foo', onFoo)   // listen
container.off('foo', onFoo)  // unlisten
unlisten() // shortcut to unlisten
```

However you can create stores and store values on it
```js
// create a store
container.register('year', 2020);

// get state
container.get('year'); // 2020

// check if a store is exist
container.has('year'); // true

// remove a store
container.unregister('year');
```

Update and listen to a store
```js
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
```js
container.emit('time', 12345); // throws an error
```

## API
TBD

------

# evstore-react
[![npm version](https://img.shields.io/npm/v/@jas-chen/evstore-react.svg?style=flat-square)](https://www.npmjs.com/package/@jas-chen/evstore-react) [![gzip size](https://img.shields.io/bundlephobia/minzip/@jas-chen/evstore-react.svg?style=flat-square)](https://bundlephobia.com/result?p=@jas-chen/evstore-react)

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
```js
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

#### Todo example
```js
import React from 'react';
import ReactDOM from 'react-dom';
import evstore from 'evstore';
import { Provider, useContainer, useStore } from 'evstore-react';

const container = evstore.create();

container.register('todos', [], (setState, getState) => {
  let id = 0;

  container.on('ADD_TODO', (label) => {
    setState(
      getState().concat({
        id: id++,
        label,
        completed: false,
      })
    );
  });

  container.on('DELETE_TODO', (id) => {
    setState(getState().filter((todo) => todo.id !== id));
  });

  container.on('TOGGLE_TODO', (id) => {
    setState(
      getState().map((todo) => {
        if (todo.id === id) {
          return { ...todo, completed: !todo.completed };
        } else {
          return todo;
        }
      })
    );
  });
});

container.register('filter', 'ALL', (setState) => {
  container.on('CHANGE_FILTER', setState);
});

container.register('filteredTodos', container.get('todos'), (setState) => {
  const updateFilterTodos = () => {
    const filter = container.get('filter');
    const todos = container.get('todos');
    setState(
      filter === 'ALL'
        ? todos
        : todos.filter((todo) => todo.completed === (filter === 'COMPLETED'))
    );
  };

  ['todos', 'filter'].forEach((key) => {
    container.on(key, updateFilterTodos);
  });
});

const TodoMVC = () => {
  const inputRef = React.useRef();
  const container = useContainer();
  const todos = useStore(container, 'filteredTodos');
  const filter = useStore(container, 'filter');
  React.useEffect(() => inputRef.current.focus(), []);

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          container.emit('ADD_TODO', inputRef.current.value);
          e.target.reset();
        }}
      >
        <input ref={inputRef} placeholder="What needs to be done?" />
      </form>
      <ul>
        {todos.map(({ id, label, completed }) => (
          <li key={id}>
            {label}
            <input
              type="checkbox"
              checked={completed}
              onChange={() => container.emit('TOGGLE_TODO', id)}
            />
            <button onClick={() => container.emit('DELETE_TODO', id)}>
              remove
            </button>
          </li>
        ))}
      </ul>
      {['ALL', 'ACTIVE', 'COMPLETED'].map((filterKey) => (
        <label key={filterKey}>
          <input
            type="radio"
            checked={filter === filterKey}
            onChange={() => container.emit('CHANGE_FILTER', filterKey)}
          />
          {filterKey}
        </label>
      ))}
    </>
  );
};

const App = () => (
  <Provider value={container}>
    <TodoMVC />
  </Provider>
);

ReactDOM.render(<App />, document.getElementById('root'));
```

## Browser Support

This package uses [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map), [Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set) and [Symbol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol), you may need polyfills for legacy browsers.

## License

[MIT License](https://opensource.org/licenses/MIT)
