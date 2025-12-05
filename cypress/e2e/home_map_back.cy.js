// Test number 1
describe('Home → Map → Back', () => {
  it('opens home page, goes to map and back', () => {
    // 1. Open home page
    cy.visit('http://localhost:5173/');
    cy.wait(2000); // wait on home screen

    // 2. Click "Mapa" button
    cy.contains('button', 'Mapa').click();
    cy.wait(2000); // wait on map view

    // 3. Click "Wróć" button on map view
    cy.contains('button', 'Wróć').click();
    cy.wait(2000); // wait after going back

    // 4. Check that home page is visible again
    cy.contains('h1', 'SentiNews').should('be.visible');
  });
});

// Test number 2
describe('Home → List → Back', () => {
  it('opens home page, goes to list and back', () => {
    // 1. Open home page
    cy.visit('http://localhost:5173/');
    cy.wait(2000); // wait on home screen

    // 2. Click "Lista newsów" button
    cy.contains('button', 'Lista newsów').click();
    cy.wait(2000); // wait on list view

    // 3. Click "Wróć" button on list view
    cy.contains('button', 'Wróć').click();
    cy.wait(2000); // wait after going back

    // 4. Check that home page is visible again
    cy.contains('h1', 'SentiNews').should('be.visible');
  });
});

// Test number 3
describe('Map → Info icon → Back', () => {
  it('opens map, clicks info icon and goes back', () => {
    // 1. Open home page
    cy.visit('http://localhost:5173/');
    cy.wait(2000); // wait on home screen

    // 2. Click "Mapa" button
    cy.contains('button', 'Mapa').click();
    cy.wait(2000); // wait on map view

    // 3. Click info icon (ℹ️) on map view
    cy.contains('div', 'ℹ️').click();
    cy.wait(2000); // wait on info panel

    // 4. Click "Wróć" button on info view
    cy.contains('button', 'Wróć').click();
    cy.wait(2000); // wait after going back

    // 5. Check that home page is visible again
    cy.contains('h1', 'SentiNews').should('be.visible');
  });
});
