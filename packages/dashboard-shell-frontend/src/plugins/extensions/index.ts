import type { Extension } from '@odh-dashboard/plugin-core';
import navigationExtensions from './navigation';
import routeExtensions from './routes';

const extensions: Extension[] = [...navigationExtensions, ...routeExtensions];

export default extensions;
