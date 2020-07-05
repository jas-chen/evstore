import { jest } from '@jest/globals'
import evstore from '.';

describe('create with constants', () => {
  test('from array of array', () => {
    const container = evstore.create([
      ['foo', 'bar'],
    ]);

    expect(container.get('foo')).toBe('bar');
  });

  test('from Map', () => {
    const container = evstore.create(new Map([
      ['foo', 123],
    ]));

    expect(container.get('foo')).toBe(123);
  });
});

describe('set constant value', () => {
  test('register with string key', () => {
    const container = evstore.create();
    const mockFn = jest.fn();
    container.on(evstore.REGISTER, mockFn);
    container.on('year', mockFn);
    container.register('year', 2020);
    expect(container.has('year')).toBe(true);
    expect(container.get('year')).toBe(2020);
    expect(mockFn.mock.calls[0][0]).toBe('year');
    expect(mockFn.mock.calls[1][0]).toBe(2020);
  });

  test('register with Symbol key', () => {
    const YEAR = Symbol('YEAR');
    const container = evstore.create();
    const mockFn = jest.fn();
    container.on(evstore.REGISTER, mockFn);
    container.on(YEAR, mockFn);
    container.register(YEAR, 2020);
    expect(container.has(YEAR)).toBe(true);
    expect(container.get(YEAR)).toBe(2020);
    expect(mockFn.mock.calls[0][0]).toBe(YEAR);
    expect(mockFn.mock.calls[1][0]).toBe(2020);
  });

  test('cannot set again', () => {
    const container = evstore.create();
    container.register('year', 2020);
    expect(() => {
      container.register('year', 2021);
    }).toThrow();
  });

  test('container.unregister', () => {
    const container = evstore.create();
    const onUnregister = jest.fn();
    container.on(evstore.UNREGISTER, onUnregister);
    container.register('yo', 'hi');
    expect(container.has('yo')).toBe(true);
    container.unregister('yo');
    expect(container.has('yo')).toBe(false);
    expect(onUnregister.mock.calls[0][0]).toBe('yo');
    expect(onUnregister.mock.calls.length).toBe(1);

    // call unregister on an unregistered store
    container.unregister('yo');
    expect(onUnregister.mock.calls.length).toBe(1);

    container.register('yo', 'hey');
    expect(container.get('yo')).toBe('hey');
  });

  test('returned unregister', () => {
    const container = evstore.create();
    const unregister = container.register('pet', 'dog');
    expect(container.has('pet')).toBe(true);
    unregister();
    expect(container.has('pet')).toBe(false);
    container.register('pet', 'cat');
    expect(container.get('pet')).toBe('cat');
  });
});

describe('event system', () => {
  const container = evstore.create();

  test('receive events', () => {
    const mockFn = jest.fn();
    const type = 'foo';
    container.on(type, mockFn);
    container.emit(type, 1);
    container.emit(type, 2);
    container.emit(type, 3);
    expect(mockFn.mock.calls[0][0]).toBe(1);
    expect(mockFn.mock.calls[1][0]).toBe(2);
    expect(mockFn.mock.calls[2][0]).toBe(3);
  });

  test('container.off()', () => {
    const mockFn = jest.fn();
    const type = 'foo';
    container.on(type, mockFn);
    container.off(type, mockFn);
    container.emit(type, 1);
    expect(mockFn.mock.calls.length).toBe(0);
  });

  test('returned off()', () => {
    const mockFn = jest.fn();
    const type = 'bar';
    const off = container.on(type, mockFn);
    off();
    container.emit(type, 1);
    expect(mockFn.mock.calls.length).toBe(0);
  });

  test('cannot emit internal events', () => {
    expect(() => {
      container.emit(evstore.REGISTER);
    }).toThrow();

    expect(() => {
      container.emit(evstore.UNREGISTER);
    }).toThrow();
  });
});


describe('stores', () => {
  test('update state, string as key', () => {
    const container = evstore.create();
    const mockFn = jest.fn();
    const cleanUp = jest.fn();

    const unregister = container.register('count', 0, (setState, getState) => {
      container.on('increment', () => setState(state => state + 1));
      container.on('decrement', () => setState(getState() - 1));
      return () => cleanUp('cleanUp');
    });

    expect(container.get('count')).toBe(0);
    container.on('count', mockFn);

    container.emit('increment');
    expect(mockFn.mock.calls[0][0]).toBe(1);
    expect(container.get('count')).toBe(1);

    container.emit('decrement');
    expect(mockFn.mock.calls[1][0]).toBe(0);
    expect(container.get('count')).toBe(0);

    expect(() => {
      container.emit('count');
    }).toThrow();

    unregister();
    expect(cleanUp.mock.calls[0][0]).toBe('cleanUp');
  });

  test('update state, Symbol as key', () => {
    const container = evstore.create();
    const mockFn = jest.fn();
    const cleanUp = jest.fn();
    const COUNT = Symbol('COUNT');

    const unregister = container.register(COUNT, 0, (setState, getState) => {
      container.on('increment', () => setState(state => state + 1));
      container.on('decrement', () => setState(getState() - 1));
      return () => cleanUp('cleanUp');
    });

    expect(container.get(COUNT)).toBe(0);
    container.on(COUNT, mockFn);

    container.emit('increment');
    expect(mockFn.mock.calls[0][0]).toBe(1);
    expect(container.get(COUNT)).toBe(1);

    container.emit('decrement');
    expect(mockFn.mock.calls[1][0]).toBe(0);
    expect(container.get(COUNT)).toBe(0);

    expect(() => {
      container.emit(COUNT);
    }).toThrow();

    unregister();
    expect(cleanUp.mock.calls[0][0]).toBe('cleanUp');
  });

  test("don't do register if updater throws", () => {
    const container = evstore.create();
    const mockFn = jest.fn();
    container.on(evstore.REGISTER, mockFn);
    container.on('count', mockFn);

    try {
      container.register('count', 0, () => {
        throw new Error();
      });
    } catch(e) {}

    expect(container.has('count')).toBe(false);
    expect(mockFn.mock.calls.length).toBe(0);
  });

  test('unregisted store cannot emit', () => {
    const container = evstore.create();
    const mockFn = jest.fn();

    container.on('count', mockFn);

    const updater = (setState) => {
      container.on('test', () => setState((s) => s + '1'));
    }

    const unregister = container.register('count', 'old', updater);

    unregister();

    container.register('count', 'new', updater);

    container.emit('test');
    expect(mockFn.mock.calls.length).toBe(3);
  });
});
