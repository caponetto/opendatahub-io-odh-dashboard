export type ObjectStorageFields = {
  endpoint: string;
  bucket: string;
  region?: string;
  path: string;
};

export type ModelLocation = {
  s3Fields: ObjectStorageFields | null;
  uri: string | null;
  ociUri: string | null;
} | null;

export const uriToModelLocation = (uri?: string): ModelLocation => {
  if (!uri) {
    return null;
  }
  try {
    const urlObj = new URL(uri);
    if (urlObj.toString().startsWith('s3:')) {
      const [bucket, ...pathSplit] = [urlObj.hostname, ...urlObj.pathname.split('/')].filter(
        Boolean,
      );
      const path = pathSplit.join('/');
      const searchParams = new URLSearchParams(urlObj.search);
      const endpoint = searchParams.get('endpoint');
      const region = searchParams.get('defaultRegion');
      if (endpoint && bucket && path) {
        return {
          s3Fields: { endpoint, bucket, region: region || undefined, path },
          uri: null,
          ociUri: null,
        };
      }
      return null;
    }
    if (uri.startsWith('oci:')) {
      return { s3Fields: null, uri: null, ociUri: uri };
    }
    return { s3Fields: null, uri, ociUri: null };
  } catch {
    return null;
  }
};

export const isRedHatRegistryUri = (uri: string): boolean =>
  uri.startsWith('oci://registry.redhat.io/');
