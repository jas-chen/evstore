import mitt from 'mitt';

const evstore = {
  create() {
    const store = new Map();
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
      on,
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
        const getState = () => store.get(key);
        const setState = (state) => {
          const finalState =
            typeof state === 'function' ? state(store.get(key)) : state;

          _setState(key, finalState);
          emit(key, finalState);
        };

        setupStore && setupStore(setState, getState);
      },
    };

    return container;
  },
};

export default evstore;
