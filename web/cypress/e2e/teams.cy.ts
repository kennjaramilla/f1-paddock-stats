describe('Teams', () => {
  beforeEach(() => cy.login('viewer'));

  it('lists current and former teams and opens a team page', () => {
    cy.visit('/teams');
    cy.contains('h1', 'Teams');
    cy.contains('h2', /On the \d{4} grid/);
    cy.contains('h2', 'Former teams');
    cy.contains('a', 'Mercedes').click();
    cy.location('pathname').should('eq', '/teams/mercedes');
    cy.contains('h1', 'Mercedes');
    cy.get('[data-cy=team-stats]').should('contain', 'Titles').and('contain', 'One-twos');
    cy.get('[data-cy=team-seasons] tbody tr').should('have.length.at.least', 10);
    cy.get('[data-cy=team-seasons]').contains('tr', '2014').should('contain', 'HAM').and('contain', 'ROS');
    cy.checkPageA11y();
  });

  it('links a driver season to the team', () => {
    cy.visit('/drivers/hamilton');
    cy.contains('a', 'Ferrari').click();
    cy.contains('h1', 'Ferrari');
    cy.get('[data-cy=team-seasons]').contains('tr', '2025').should('contain', 'new');
  });

  it('shows a not-found state for an unknown team', () => {
    cy.visit('/teams/not-a-team');
    cy.contains('Team not found').should('be.visible');
  });
});
