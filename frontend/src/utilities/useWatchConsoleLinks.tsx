import * as React from 'react';
import * as _ from 'lodash-es';
import { ConsoleLinkKind } from '#~/k8sTypes';
import { fetchConsoleLinks } from '#~/services/consoleLinksService';
import { useAppSelector } from '#~/redux/hooks';
import { PlatformType } from '#~/redux/types';
import { POLL_INTERVAL } from './const';

export type ConsoleLinkResults = {
  consoleLinks: ConsoleLinkKind[];
  loaded: boolean;
  loadError?: Error;
};

export const useWatchConsoleLinks = (): ConsoleLinkResults => {
  const platform = useAppSelector((state) => state.platform);
  const [results, setResults] = React.useState<ConsoleLinkResults>({
    consoleLinks: [],
    loaded: false,
  });
  const previousResults = React.useRef<ConsoleLinkResults>({
    consoleLinks: [],
    loaded: false,
  });

  React.useEffect(() => {
    if (platform !== PlatformType.OpenShift) {
      setResults({ consoleLinks: [], loaded: true });
      return;
    }
    let watchHandle: ReturnType<typeof setTimeout>;
    const watchConsoleLinks = () => {
      fetchConsoleLinks()
        .then((consoleLinks: ConsoleLinkKind[]) => {
          const newResults: ConsoleLinkResults = {
            consoleLinks,
            loaded: true,
          };
          if (!_.isEqual(newResults, previousResults.current)) {
            setResults(newResults);
            previousResults.current = newResults;
          }
        })
        .catch((e) => {
          setResults({ consoleLinks: [], loaded: false, loadError: e });
        });
      watchHandle = setTimeout(watchConsoleLinks, POLL_INTERVAL);
    };
    watchConsoleLinks();

    return () => {
      clearTimeout(watchHandle);
    };
  }, [platform]);

  return results;
};
