import React from 'react';

const Context = React.createContext();

export const Provider = ({ value, children }) => {
  if (!value) {
    throw new Error('Store is not defined.');
  }

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useContainer = () => React.useContext(Context);

export const useStore = (container, key) => {
  const [state, setState] = React.useState(() => container.get(key));

  React.useEffect(() => {
    container.on(key, setState);
    return () => container.off(key);
  }, [key, container]);

  return state;
};
