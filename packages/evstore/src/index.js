import mitt from 'mitt';

const REGISTER = Symbol('REGISTER');
const UNREGISTER = Symbol('UNREGISTER');

const evstore = {
  REGISTER,
  UNREGISTER,
  create(constants) {
    const store = new Map(constants);
    const { on, off, emit } = mitt();
    const cleanUp = new Map();

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
        if (type === REGISTER || type === UNREGISTER) {
          throw new Error(
            `Event type \`${type.toString()}\` cannot be emitted.`
          );
        }

        if (store.has(type)) {
          throw new Error(
            `Event type \`${type.toString()}\` can only be emitted from it's registrant.`
          );
        }

        emit(type, evt);
      },
      register(key, initState, updater) {
        if (store.has(key)) {
          throw new Error(
            `Store \`${key.toString()}\` has been registered.`
          );
        }

        if (updater) {
          let unregistered = false;
          const getState = () => store.get(key);
          const setState = (state) => {
            if (unregistered) return;
            const finalState =
              typeof state === 'function' ? state(store.get(key)) : state;

            _setState(key, finalState);
          };

          const cleanUpFn = updater(setState, getState);
          on(UNREGISTER, function listenUnregister(unresisterKey) {
            if (unresisterKey === key) {
              unregistered = true;
              off(UNREGISTER, listenUnregister);
            }
          });

          cleanUpFn && cleanUp.set(key, cleanUpFn);
        }

        emit(REGISTER, key);
        _setState(key, initState);

        return function unregister() {
          container.unregister(key);
        };
      },
      unregister(key) {
        if (!store.has(key)) return;

        cleanUp.has(key) && cleanUp.get(key)();
        store.delete(key);
        cleanUp.delete(key);
        emit(UNREGISTER, key);
      },
      has: (key) => store.has(key),
    };

    return container;
  },
};

export default evstore;
