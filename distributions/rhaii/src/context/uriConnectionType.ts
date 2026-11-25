import { type ConnectionTypeConfigMapObj } from '@odh-dashboard/k8s-core';

/**
 * The name the shared model-serving code looks up for URI compatibility
 * (`getModelServingConnectionTypeName`) and the default connection type name
 * `handleConnectionCreation` falls back to.
 */
const URI_CONNECTION_TYPE_NAME = 'uri-v1';

/** The built-in URI connection type: no ConfigMap backs it, the host provides it directly. */
export const createUriConnectionType = (namespace: string): ConnectionTypeConfigMapObj => ({
  apiVersion: 'v1',
  kind: 'ConfigMap',
  metadata: {
    name: URI_CONNECTION_TYPE_NAME,
    namespace,
    labels: {
      'opendatahub.io/dashboard': 'true',
      'opendatahub.io/connection-type': 'true',
    },
    annotations: {
      'openshift.io/display-name': 'URI',
      'openshift.io/description': 'Direct URI to the model location.',
      'opendatahub.io/disabled': 'false',
    },
  },
  data: {
    fields: [
      {
        envVar: 'URI',
        name: 'URI',
        description: 'URI of the model to deploy.',
        required: true,
        type: 'uri',
        properties: {},
      },
    ],
  },
});
