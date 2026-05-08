import React from 'react';
import { act, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useUser } from '@odh-dashboard/dashboard-foundation-frontend/redux/selectors';
import EmptyProjects from '@odh-dashboard/workbenches/pages/screens/projects/EmptyProjects';

jest.mock('@odh-dashboard/dashboard-foundation-frontend/app/AppContext', () => ({
  __esModule: true,
  useAppContext: jest.fn(),
}));

jest.mock('@odh-dashboard/dashboard-foundation-frontend/redux/selectors', () => ({
  ...jest.requireActual('@odh-dashboard/dashboard-foundation-frontend/redux/selectors'),
  useUser: jest.fn(),
  useClusterInfo: jest.fn(),
}));
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

const useUserMock = jest.mocked(useUser);
useUserMock.mockReturnValue({
  username: 'test-user',
  userID: '1234',
  isAdmin: false,
  isAllowed: true,
  userLoading: false,
  userError: null,
});

describe('EmptyProjects', () => {
  it('should show the create project button when allowed to create projects', async () => {
    render(<EmptyProjects allowCreate />);
    const createProject = await screen.findByTestId('create-project');
    expect(createProject).toBeEnabled();
    expect(createProject).not.toHaveAttribute('href');
    const bodyText = await screen.findByTestId('projects-empty-body-text');
    expect(bodyText).toHaveTextContent(
      'Projects allow you and your team to organize and collaborate on resources within separate namespaces.',
    );
    expect(bodyText).not.toHaveTextContent('To request a project, contact your administrator.');
  });
  it('should show the who is my admin help when not allowed to create projects', async () => {
    render(<EmptyProjects allowCreate={false} />);
    const bodyText = await screen.findByTestId('projects-empty-body-text');
    expect(bodyText).toHaveTextContent(
      'Projects allow you and your team to organize and collaborate on resources within separate namespaces. To request a project, contact your administrator.',
    );
    const adminHelpButton = await screen.findByTestId('projects-empty-admin-help');
    act(() => adminHelpButton.click());
    const helpContent = await screen.findByTestId('projects-empty-admin-help-content');
    expect(helpContent).toBeVisible();
  });
});
