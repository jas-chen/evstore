import React from 'react';

const Context = React.createContext();

export const Provider = (props) => {
  if (!props.value) {
    throw new Error('Store is not defined.');
  }

  return React.createElement(Context.Provider, props);
};

export const useContainer = () => React.useContext(Context);

export const useOn = (container, type, callback) => {
  React.useEffect(() => {
    container.on(type, callback);
    return () => container.off(type, callback);
  }, [container, callback]);
}

export const useStore = (container, type) => {
  const [state, setState] = React.useState(() => container.get(type));
  useOn(container, type, setState);
  return state;
};
