export enum AwsKeys {
  NAME = 'Name',
  ACCESS_KEY_ID = 'AWS_ACCESS_KEY_ID',
  SECRET_ACCESS_KEY = 'AWS_SECRET_ACCESS_KEY',
  S3_ENDPOINT = 'AWS_S3_ENDPOINT',
  DEFAULT_REGION = 'AWS_DEFAULT_REGION',
  AWS_S3_BUCKET = 'AWS_S3_BUCKET',
}

export type AWSDataEntry = { key: AwsKeys; value: string }[];
