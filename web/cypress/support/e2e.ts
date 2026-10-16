import 'cypress-axe';
import type { Result } from 'axe-core';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      checkPageA11y(): Chainable<void>;
    }
  }
}

function logViolations(violations: Result[]) {
  cy.task('log', violations.map((v) => `${v.impact} ${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`).join('\n'));
}

Cypress.Commands.add('checkPageA11y', () => {
  cy.injectAxe();
  cy.checkA11y(undefined, { includedImpacts: ['critical', 'serious'] }, logViolations);
});
