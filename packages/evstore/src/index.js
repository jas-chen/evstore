import mitt from 'mitt';

const noop = () => {};
const REGISTER = Symbol('REGISTER');
const UNREGISTER = Symbol('UNREGISTER');

const evstore = {
  REGISTER,
  UNREGISTER,
  create(constants) {
    const store = new Map(constants);
    const updaters = new Map();
    const keys = new Set();
    const { on, off, emit } = mitt();
    const cleanUp = new Map();

    const checkKey = (key) => {
      if (keys.has(key)) {
        throw new Error(
          `Event type \`${key.toString()}\` can only be emitted from it's registrant`
        );
      }
    };

    const _setState = (key, state) => {
      store.set(key, state);
      emit(key, state);
    };

    const container = {
      get: (key) => store.get(key),
      on: (type, handler) => {
        on(type, handler);

        return function off() {
          container.off(type, handler);
        };
      },
      off,
      emit(type, evt) {
        checkKey(type);
        emit(type, evt);
      },
      register(key, initState, setupStore) {
        checkKey(key);
        keys.add(key);
        emit(REGISTER, key);
        _setState(key, initState);
        let cleanUpFn;

        if (setupStore) {
          updaters.set(key, setupStore);
          const getState = () => store.get(key);
          const setState = (state) => {
            if (updaters.get(key) !== setupStore) return;
            const finalState =
              typeof state === 'function' ? state(store.get(key)) : state;

            _setState(key, finalState);
          };

          cleanUpFn = setupStore(setState, getState);
        }

        cleanUp.set(key, cleanUpFn || noop);

        return function unregister() {
          container.unregister(key);
        };
      },
      unregister(key) {
        cleanUp.get(key)();
        emit(UNREGISTER, key);
        keys.delete(key);
        updaters.delete(key);
        store.delete(key);
        cleanUp.delete(key);
      },
      has: (key) => store.has(key),
    };

    return container;
  },
};

export default evstore;
