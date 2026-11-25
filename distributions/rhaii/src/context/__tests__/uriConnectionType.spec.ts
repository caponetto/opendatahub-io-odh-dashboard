import {
  filterEnabledConnectionTypes,
  filterModelServingConnectionTypes,
  isModelServingCompatible,
  ModelServingCompatibleTypes,
} from '@odh-dashboard/k8s-core';
import { createUriConnectionType } from '../uriConnectionType';

describe('createUriConnectionType', () => {
  it('should be model-serving compatible as a URI type', () => {
    const type = createUriConnectionType('rhaii-operator');

    expect(isModelServingCompatible(type, ModelServingCompatibleTypes.URI)).toBe(true);
  });

  it('should pass the enabled filter the wizard applies to connection types', () => {
    const type = createUriConnectionType('rhaii-operator');

    expect(filterEnabledConnectionTypes([type])).toHaveLength(1);
  });

  it('should be found by the shared model-serving type lookup', () => {
    // The wizard offers the URI option only when this lookup finds the type.
    const matches = filterModelServingConnectionTypes([createUriConnectionType('rhaii-operator')]);

    expect(matches.map((match) => match.key)).toContain(ModelServingCompatibleTypes.URI);
  });
});
