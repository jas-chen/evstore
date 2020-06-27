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
  const container = evstore.create();

  test('value set', () => {
    container.register('year', 2020);
    expect(container.get('year')).toBe(2020);

    const YEAR = Symbol('YEAR')
    container.register(YEAR, 2020);
    expect(container.get(YEAR)).toBe(2020);
  });

  test('cannot set again', () => {
    expect(() => {
      container.register('year', 2021);
    }).toThrow();
  });

  test('cannot set undefined', () => {
    expect(() => {
      container.register('birthday');
    }).toThrow();

    expect(() => {
      container.register('phone', undefined);
    }).toThrow();
  });

  test('container.unregister', () => {
    const mockFn = jest.fn();
    container.on(evstore.UNREGISTER, mockFn);
    container.register('yo', 'hi');
    container.unregister('yo');
    expect(mockFn.mock.calls[0][0]).toBe('yo');
    container.register('yo', 'hey');
    expect(container.get('yo')).toBe('hey');
  });

  test('returned unregister', () => {
    const unregister = container.register('pet', 'dog');
    unregister();
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
});


describe('stores', () => {
  const container = evstore.create();

  test('update state, string as key', () => {
    const mockFn = jest.fn();

    container.register('count', 0, (setState, getState) => {
      container.on('increment', () => setState(state => state + 1));
      container.on('decrement', () => setState(getState() - 1));
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
  });

  test('update state, Symbol as key', () => {
    const mockFn = jest.fn();
    const COUNT = Symbol('COUNT');

    container.register(COUNT, 0, (setState, getState) => {
      container.on('increment', () => setState(state => state + 1));
      container.on('decrement', () => setState(getState() - 1));
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
  });
});