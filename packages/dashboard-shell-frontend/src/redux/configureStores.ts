import { createStore, applyMiddleware, compose, Action, Reducer, Store } from 'redux';
import reduxThunk from 'redux-thunk';

const ODH_PRODUCT_NAME = process.env.ODH_PRODUCT_NAME ?? '';

export function configureStores<S, A extends Action>(
  appReducer: Reducer<S, A>,
): { store: Store<S, A> } {
  const composeEnhancers =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/consistent-type-assertions
    (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__?.({
      name: ODH_PRODUCT_NAME,
    }) || compose;

  const store = createStore(appReducer, composeEnhancers(applyMiddleware(reduxThunk)));

  return { store };
}
