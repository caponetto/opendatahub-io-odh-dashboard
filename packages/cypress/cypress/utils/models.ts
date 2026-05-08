import { modelServingSection } from '../pages/modelServing';

const maxAttempts = 5;
let attempts = 0;

export function attemptToClickTooltip(): void {
  if (attempts >= maxAttempts) {
    throw new Error('Failed to find and click the status tooltip after 5 attempts');
  }

  modelServingSection.findStatusTooltip().then(($tooltip) => {
    if ($tooltip.length > 0 && $tooltip.is(':visible')) {
      modelServingSection.findStatusTooltip().click({ force: true });
      cy.contains('Model deployment is active', { timeout: 120000 }).should('be.visible');
    } else {
      attempts++;
      cy.reload();
      attemptToClickTooltip();
    }
  });
}
