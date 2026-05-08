export const platformKeyMap = {
  single: 'kServe',
} as const;

export const SERVING_RUNTIME_SCOPE = {
  Global: 'global',
  Project: 'project',
};

export enum StorageKeys {
  ACCESS_KEY_ID = 'access_key_id',
  SECRET_ACCESS_KEY = 'secret_access_key',
  S3_ENDPOINT = 'endpoint_url',
  DEFAULT_BUCKET = 'default_bucket',
  DEFAULT_REGION = 'region',
  PATH = 'path',
}

export enum ServingRuntimeVersionStatusLabel {
  LATEST = 'Latest',
  OUTDATED = 'Outdated',
}
