import * as React from 'react';
import { K8sAPIProvider } from '@odh-dashboard/k8s-browser';

type SDKInitializeProps = {
  children: React.ReactNode;
};

const SDKInitialize: React.FC<SDKInitializeProps> = ({ children }) => (
  <K8sAPIProvider>{children}</K8sAPIProvider>
);

export default SDKInitialize;
