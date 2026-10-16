describe('Role-based access', () => {
  it('sends anonymous visitors to the login page and back after one-click sign-in', () => {
    cy.clearCookies();
    cy.visit('/season/2021');
    cy.location('pathname').should('eq', '/login');
    cy.checkPageA11y();
    cy.get('[data-testid=login-viewer]').click();
    cy.location('pathname').should('eq', '/season/2021');
    cy.get('[data-testid=role-badge]').should('have.text', 'Viewer');
  });

  it('blocks viewers from head-to-head and admin', () => {
    cy.login('viewer');
    cy.visit('/compare');
    cy.location('pathname').should('eq', '/forbidden');
    cy.contains('h1', 'Requires Analyst role');
    cy.visit('/admin');
    cy.contains('h1', 'Requires Admin role');
    cy.get('nav[aria-label=Primary]').should('not.contain', 'Admin');
  });

  it('lets admins into everything', () => {
    cy.login('admin');
    cy.visit('/admin');
    cy.contains('h2', 'Users');
    cy.contains('td', 'analyst@paddock.demo');
    cy.contains('Disabled in this deployment');
    cy.checkPageA11y();
  });

  it('rejects bad credentials with a clear message', () => {
    cy.clearCookies();
    cy.visit('/login');
    cy.get('input[type=email]').type('viewer@paddock.demo');
    cy.get('input[type=password]').type('wrong');
    cy.contains('button', /^Sign in$/).click();
    cy.get('[role=alert]').should('contain', 'Incorrect email or password');
  });
});
