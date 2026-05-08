import appReducer from '@odh-dashboard/dashboard-foundation-frontend/redux/reducers/appReducer';
import { createDashboardApp } from '@odh-dashboard/dashboard-shell-frontend';
import App from '@odh-dashboard/dashboard-shell-frontend/app/App';

createDashboardApp({ App, appReducer });
