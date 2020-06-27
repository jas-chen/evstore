import mitt from 'mitt';

const UNREGISTER = Symbol('UNREGISTER');

const evstore = {
  create(constants) {
    const store = new Map(constants);
    const keys = new Set();
    const { on, off, emit } = mitt();

    const _setState = (key, state) => {
      if (state === undefined) {
        throw new Error(
          `Setting state \`${key}\` to undefined is not allowed, please set to null instead.`
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
        }
      },
      off,
      emit(type, evt) {
        if (keys.has(type)) {
          throw new Error(
            `Event type \`${type}\` can only be emitted from it's registrant`
          );
        }

        return emit(type, evt);
      },
      register(key, initState, setupStore) {
        keys.add(key);
        _setState(key, initState);

        if (setupStore) {
          const getState = () => store.get(key);
          const setState = (state) => {
            const finalState =
              typeof state === 'function' ? state(store.get(key)) : state;

            _setState(key, finalState);
            emit(key, finalState);
          };

          setupStore(setState, getState);
        }

        return function unregister() {
          container.unregister(key);
        }
      },
      unregister(key) {
        emit(UNREGISTER, key);
        keys.delete(key);
        store.delete(key);
      },
    };

    return container;
  },
  UNREGISTER,
};

export default evstore;
