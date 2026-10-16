describe('Circuits', () => {
  beforeEach(() => cy.login('viewer'));

  it('filters and opens a circuit', () => {
    cy.visit('/circuits');
    cy.get('[data-testid=circuit-search]').type('monaco');
    cy.location('search').should('contain', 'q=monaco');
    cy.contains('1 circuits').should('exist');
    cy.contains('a', 'Circuit de Monaco').click();
    cy.contains('h1', 'Circuit de Monaco');
    cy.contains('h2', 'Every winner');
    cy.contains('Pole to win');
    cy.checkPageA11y();
  });

  it('handles empty results', () => {
    cy.visit('/circuits?q=atlantis');
    cy.contains('No circuits found').should('be.visible');
  });
});

describe('Drivers', () => {
  beforeEach(() => cy.login('viewer'));

  it('opens a driver career page', () => {
    cy.visit('/drivers?q=verstappen');
    cy.contains('a', 'Max Verstappen').click();
    cy.contains('h1', 'Max Verstappen');
    cy.contains('Championship finish by season');
    cy.checkPageA11y();
  });
});
