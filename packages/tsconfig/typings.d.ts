declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.svg';
declare module '*.css';
declare module '*.wav';
declare module '*.mp3';
declare module '*.m4a';
declare module '*.rdf';
declare module '*.ttl';
declare module '*.pdf';
declare module '*.yaml';

// eslint-disable-next-line @typescript-eslint/naming-convention -- Webpack DefinePlugin global
declare const __COMMIT_HASH__: string | undefined;
