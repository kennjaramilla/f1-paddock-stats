describe('Head-to-head', () => {
  it('picks two drivers with the keyboard only', () => {
    cy.visit('/compare');
    cy.contains('Choose two drivers').should('be.visible');
    cy.get('[data-testid=driver-a] input[role=combobox]').focus().type('hamil');
    cy.get('[data-testid=driver-a] [role=option]').first().should('contain', 'Lewis Hamilton');
    cy.get('[data-testid=driver-a] input').type('{enter}');
    cy.get('[data-testid=driver-b] input[role=combobox]').focus().type('rosb{downarrow}{uparrow}{enter}');
    cy.location('search').should('contain', 'a=hamilton').and('contain', 'b=rosberg');
    cy.get('[data-testid=h2h-results]').within(() => {
      cy.contains('Race battle');
      cy.contains('59 as teammates');
    });
    cy.checkPageA11y();
  });

  it('restores a shared link and narrows the season range', () => {
    cy.visit('/compare?a=hamilton&b=rosberg&from=2016&to=2016');
    cy.contains('h2', 'Totals · 2016');
    cy.get('[data-testid=h2h-results] section[aria-label="2016 season"]').should('exist');
    cy.get('[data-testid=h2h-results] section[aria-label="2014 season"]').should('not.exist');
  });

  it('loads a featured rivalry and swaps sides', () => {
    cy.visit('/compare');
    cy.contains('button', 'Norris vs Piastri').click();
    cy.location('search').should('contain', 'a=norris');
    cy.get('[aria-label="Swap drivers"]').click();
    cy.location('search').should('contain', 'a=piastri').and('contain', 'b=norris');
  });
});
