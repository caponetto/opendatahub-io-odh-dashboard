import {
  Notebook,
  TypedPromiseRejectedResult,
} from '@odh-dashboard/dashboard-foundation-frontend/types';
import { allSettledPromises } from '@odh-dashboard/dashboard-foundation-frontend/utilities/allSettledPromises';
import { stopNotebook } from '../services/notebookService';

export const stopWorkbenches = (
  notebooksToStop: Notebook[],
  isAdmin: boolean,
): Promise<
  [
    PromiseFulfilledResult<Notebook | void>[],
    TypedPromiseRejectedResult<undefined>[],
    PromiseSettledResult<Notebook | void>[],
  ]
> =>
  allSettledPromises<Notebook | void>(
    notebooksToStop.map((notebook) => {
      const notebookName = notebook.metadata.name || '';
      if (!notebookName) {
        return Promise.resolve();
      }

      if (!isAdmin) {
        return stopNotebook();
      }

      const notebookUser = notebook.metadata.annotations?.['opendatahub.io/username'];
      if (!notebookUser) {
        return Promise.resolve();
      }

      return stopNotebook(notebookUser);
    }),
  );
