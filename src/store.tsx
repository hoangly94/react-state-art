import _, { get as _get, capitalize, isObject, set } from 'lodash';
import {
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
// import storage from '../storage';

type ConvertGetters<G extends StoreGetters> = {
  [K in keyof G]: ReturnType<G[K]>;
};


export type StoreSelectorType<T> = <V>(s: (state: T) => V) => V;

type ReturnStore<T, A, G extends StoreGetters, M> = T & A & ConvertGetters<G>

type CreateStoreReturnType<T, A, G extends StoreGetters, M, N extends string> = {
  [K in `use${Capitalize<N>}Store`]: () => T & A & ConvertGetters<G>;
  // [K in `use${Capitalize<N>}Store`]: () => ContextValues<T, A, G, M> & T & A & G ;
} & {
  [K in `${Capitalize<N>}StoreProvider`]: ({
    children,
  }: StoreProviderProps) => React.JSX.Element;
} & { [K in `${N}Store`]: ReturnStore<T, A, G, M> };

type Subscriber<T> = (state: T) => void;
type StoreDispatch<T> = (fn: (state: T) => void) => void;
export type StoreActions = { readonly [key: string]: (...args: any[]) => void };
export type StoreGetters = { readonly [key: string]: (...args: any[]) => any };

type Transition<T, A, G extends StoreGetters, M extends string> = (
  store: ReturnStore<T, A, G, M>,
) => void;
type Transitions<T, A, G extends StoreGetters, M extends string> = {
  [O in M | 'ANY']?: {
    [N in Exclude<M | 'ANY', O>]?: Transition<T, A, G, M>;
  };
};

export interface StateMachine<T, A, G extends StoreGetters, M extends string> {
  currentState: M;
  startTransition?: Transition<T, A, G, M>;
  transitions: Transitions<T, A, G, M>;
}

type Test<A extends StoreActions> = {
  [key in keyof A]?: (...args: Parameters<A[key]>) => void;
};
interface CreateStoreProps<
  T,
  A extends StoreActions,
  G extends StoreGetters,
  M extends string,
  N extends string,
> {
  name: N;
  state: T;
  onMounted?: (state: T, dispatch: StoreDispatch<T>) => void;
  onStorageLoaded?: (state: T, dispatch: StoreDispatch<T>) => void;
  stateMachine?: StateMachine<T, A, G, M>;
  getters?: G & ThisType<ReturnStore<T, A, G, M>>;
  actions: A & ThisType<ReturnStore<T, A, G, M>>;
  efftects?: Test<A>;
  persist?: boolean;
}

interface StoreProviderProps {
  children: React.ReactNode;
}

interface Selector<T> {
  s: (state: T) => any;
  v: any;
}

const metaStoreDict: Record<string, {
  store: any,
  subscribers: Set<Subscriber<any>>,
}> = {}

export function createStore<
  T,
  A extends StoreActions,
  G extends StoreGetters,
  M extends string,
  N extends string,
>({
  name,
  state: initialState,
  stateMachine,
  getters,
  actions,
  persist = true,
}: CreateStoreProps<T, A, G, M, N>): CreateStoreReturnType<T, A, G, M, N> {
  const storeName = `${capitalize(name)}Store`;
  const storageName = `${name}Store`;

  const data = {
    state: initialState,
  };
  Object.defineProperty(data, 'state', {
    writable: false,
  });

  const subscribers = (metaStoreDict[name]?.subscribers ?? new Set()) as Set<Subscriber<any>>

  const dispatch: StoreDispatch<T> = (fn: (state: T) => void) => {
    fn(data.state);
    subscribers.forEach(subscriber => subscriber(data.state));
  };

  const stateMachineData = {
    current: (stateMachine?.currentState ?? '') as M,
  };

  function getStore(state: T) {
    if (metaStoreDict[name]) {
      return {
        ...metaStoreDict[name]?.store,
        ...state,
      }
    }

    const store = state;
    Object.entries(getters ?? {}).forEach(([k, v]: any) => {
      if ((state as any).hasOwnProperty(k)) return;
      Object.defineProperty(store, k, {
        get: () => v.apply(state),
        enumerable: true,
      });
    })

    Object.entries(actions ?? {}).forEach(([k, v]: any) => {
      if ((state as any).hasOwnProperty(k)) return;
      Object.defineProperty(store, k, {
        value: (...args: Parameters<typeof v>) => {
          dispatch(() => v.apply(store, args));
          // (efftects?.[k] as any)?.(...args);
        },
      });
    })


    metaStoreDict[name] = {
      store,
      subscribers,
    }

    return store
  }

  function useStore() {
    const [rerenderCount, setRerenderCount] = useState(0);
    const selectorDict = useMemo(() => ({} as Record<string, Selector<T>>), []);

    const subscriber = useMemo(() => createSubscriber(selectorDict, setRerenderCount), []);

    useLayoutEffect(() => {
      subscribers.add(subscriber);
      return () => { subscribers.delete(subscriber) };
    }, [subscriber]);

    const createProxiedState = (state: any, key?: string) => {
      return new Proxy(state, {
        get(target, prop) {
          const newKey = `${key ?? ''}${(key && '.') ?? ''}${String(prop)}`;
          const value = target[prop];
          if (!target.hasOwnProperty(prop) || typeof value === 'function') { return value }
          if (typeof value === 'object' && value !== null) {
            return createProxiedState(value, newKey);
          }

          selectorDict[newKey] = {
            s: state => _get(state, newKey),
            v: value,
          }
          
          return getters?.hasOwnProperty(newKey) ? getters[newKey].call(state) : value;
        },
        set(target, prop, value) {
          target[prop] = value;
          const newKey = `${key ?? ''}${(key && '.') ?? ''}${String(prop)}`;
          
          if (actions?.hasOwnProperty(newKey)) {
            actions[newKey]
          } else {
            dispatch(state => _.set(state as any, newKey, value));
          }
          return true;
        }
      });
    };

    const store = useMemo(() => createProxiedState(getStore(data.state)), [data.state]);
    return store;
  }

  return {
    [`use${storeName}`]: useStore,
    get [storageName]() { return getStore(data.state) },
  } as any;
}

const createSubscriber = (selectorDict: Record<string, Selector<any>>, setRerenderCount: React.Dispatch<React.SetStateAction<number>>) => (newState: any) => {
  const selectorList = Object.values(selectorDict)
  for (const selector of selectorList) {
    const { s, v } = selector;
    const newValue = s(newState);
    if (newValue !== v) {
      selector.v = newValue;
      return setRerenderCount(c => c + 1);
  }
};