import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { createUriConnectionType } from '../../context/uriConnectionType';
import UriConnectionFormFields from '../UriConnectionFormFields';

describe('UriConnectionFormFields', () => {
  const uriType = createUriConnectionType('rhaii-operator');
  const fields = uriType.data?.fields;

  it('should render a required URI input bound to the connection values', () => {
    render(<UriConnectionFormFields fields={fields} connectionValues={{ URI: 'hf://model' }} />);

    const input = screen.getByTestId('rhaii-model-uri');
    expect(input).toHaveValue('hf://model');
    expect(input).toHaveAttribute('required');
  });

  it('should report edits through onChange', () => {
    const onChange = jest.fn();
    render(<UriConnectionFormFields fields={fields} onChange={onChange} />);

    fireEvent.change(screen.getByTestId('rhaii-model-uri'), { target: { value: 'hf://model' } });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ envVar: 'URI' }), 'hf://model');
  });

  it('should render nothing without a URI field', () => {
    const { container } = render(<UriConnectionFormFields fields={undefined} />);

    expect(container).toBeEmptyDOMElement();
  });
});
