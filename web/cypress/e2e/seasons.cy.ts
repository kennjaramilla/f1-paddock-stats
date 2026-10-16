describe('Seasons (viewer)', () => {
  beforeEach(() => cy.login('viewer'));

  it('lists seasons and opens one', () => {
    cy.visit('/');
    cy.contains('h1', 'Every title fight').should('be.visible');
    cy.get('[data-testid^=season-card-]').should('have.length.greaterThan', 10);
    cy.checkPageA11y();
    cy.get('[data-testid=season-card-2021]').click();
    cy.location('pathname').should('eq', '/season/2021');
    cy.contains('Max Verstappen won the title by 8 points').should('be.visible');
    cy.contains('Computed totals match official standings').should('be.visible');
  });

  it('switches top-N, teams and table views, and remembers them', () => {
    cy.visit('/season/2021');
    cy.get('[data-testid=progression-chart] path[data-series]').should('have.length', 10);
    cy.contains('[role=radio]', /^5$/).click();
    cy.get('[data-testid=progression-chart] path[data-series]').should('have.length', 5);
    cy.contains('[role=radio]', 'Teams').click();
    cy.contains('h2', "Constructors' championship");
    cy.contains('[role=radio]', 'Table').click();
    cy.get('[role=region][aria-label="Cumulative points table"] tbody tr').should('have.length', 5);
    cy.reload();
    cy.contains('[role=radio][aria-checked=true]', 'Teams');
    cy.contains('[role=radio][aria-checked=true]', 'Table');
    cy.checkPageA11y();
  });

  it('highlights a driver and shows head-to-head as locked for viewers', () => {
    cy.visit('/season/2021');
    cy.contains('button', 'Lewis Hamilton').click();
    cy.get('section[aria-label="Lewis Hamilton summary"]').within(() => {
      cy.contains('Compare with teammate BOT').should('have.attr', 'aria-disabled', 'true').and('have.attr', 'title', 'Requires Analyst role');
    });
  });

  it('supports keyboard scrubbing on the chart', () => {
    cy.visit('/season/2021');
    cy.get('[data-testid=progression-chart]').focus().trigger('keydown', { key: 'ArrowLeft' });
    cy.get('[aria-live=polite]').should('contain', 'Round 21');
  });

  it('shows a friendly empty state for unknown seasons', () => {
    cy.visit('/season/1950');
    cy.contains('Season not found').should('be.visible');
  });
});
