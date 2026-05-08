import appReducer from '@odh-dashboard/dashboard-foundation-frontend/redux/reducers/appReducer';
import { createDashboardApp } from '@odh-dashboard/dashboard-shell-frontend';
import SlimApp from './app/SlimApp';

createDashboardApp({ App: SlimApp, appReducer });
