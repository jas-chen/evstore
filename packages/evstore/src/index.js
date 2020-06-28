import mitt from 'mitt';

const noop = () => {};

const evstore = {
  create(constants) {
    const REGISTER = Symbol('REGISTER');
    const UNREGISTER = Symbol('UNREGISTER');
    const store = new Map(constants);
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
      if (state === undefined) {
        throw new Error(
          `Setting state \`${key.toString()}\` to undefined is not allowed, please set to null instead.`
        );
      }

      store.set(key, state);
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
        _setState(key, initState);
        let cleanUpFn;

        if (setupStore) {
          const getState = () => store.get(key);
          const setState = (state) => {
            const finalState =
              typeof state === 'function' ? state(store.get(key)) : state;

            _setState(key, finalState);
            emit(key, finalState);
          };

          cleanUpFn = setupStore(setState, getState);
        }

        cleanUp.set(key, cleanUpFn || noop);
        emit(REGISTER, key);

        return function unregister() {
          container.unregister(key);
        };
      },
      unregister(key) {
        cleanUp.get(key)();
        emit(UNREGISTER, key);
        keys.delete(key);
        store.delete(key);
        cleanUp.delete(key);
      },
      REGISTER,
      UNREGISTER,
    };

    return container;
  },
};

export default evstore;
