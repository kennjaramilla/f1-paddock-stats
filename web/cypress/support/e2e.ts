import 'cypress-axe';
import type { Result } from 'axe-core';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      checkPageA11y(): Chainable<void>;
      login(role: 'viewer' | 'analyst' | 'admin'): Chainable<void>;
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

/** Signs in through the BFF route (no UI) and caches the cookie per role. */
Cypress.Commands.add('login', (role) => {
  cy.session(role, () => {
    cy.request('POST', '/api/auth/login', { email: `${role}@paddock.demo`, password: `${role}-demo` });
  });
});

// Cypress injects a script into <head> before React hydrates, which React 19 reports as a hydration
// mismatch (#418). It doesn't occur in real browsers (verified with Playwright), so only that error is ignored.
Cypress.on('uncaught:exception', (err) => !err.message.includes('Minified React error #418'));
