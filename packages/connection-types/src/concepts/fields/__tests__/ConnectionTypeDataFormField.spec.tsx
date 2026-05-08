import * as React from 'react';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import {
  ConnectionTypeDataField,
  connectionTypeDataFields,
  ConnectionTypeFieldType,
} from '@odh-dashboard/connection-types-shared/concepts/connectionTypes/types';
import ConnectionTypeDataFormField from '@odh-dashboard/connection-types-shared/concepts/connectionTypes/fields/ConnectionTypeDataFormField';

describe('ConnectionTypeDataFormField', () => {
  it('should render field for each connection type', () => {
    const test = (type: ConnectionTypeFieldType) => {
      const field = {
        type,
        name: 'test-name',
        envVar: 'test_envVar',
        properties: {},
      } as ConnectionTypeDataField;
      expect(
        render(<ConnectionTypeDataFormField id="test" field={field} />).container.firstChild,
      ).not.toBeNull();
    };
    connectionTypeDataFields.forEach((t) => test(t));
  });
});
