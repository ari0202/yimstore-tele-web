/// <reference types="cypress" />

describe('Admin Product Creation - Exhaustive Testing', () => {
  const loginAdmin = () => {
    cy.session('admin-session', () => {
      cy.visit('/admin/login');
      cy.get('input[name="username"]').type('admin');
      cy.get('input[name="password"]').type('admin123'); 
      cy.get('button[type="submit"]').click();
      cy.url().should('not.include', '/admin/login');
    });
  };

  before(() => {
    // We assume the dummy seeder script has run and injected standard categories
    // For test isolation, we'll run it in a clean state
  });

  beforeEach(() => {
    loginAdmin();
    // 3. Navigate directly to Add Product page
    cy.visit('/admin/products/add');
    cy.url().should('include', '/admin/products/add');
  });

  context('Desktop View', () => {
    beforeEach(() => {
      cy.viewport(1280, 720); // Desktop viewport
    });

    it('should display the product creation form with correct initial UI elements', () => {
      cy.contains('h1', 'Tambah Produk Baru').should('be.visible');
      cy.get('[data-testid="product-name"]').should('be.visible');
      cy.get('[data-testid="product-category"]').should('be.visible');
      cy.get('[data-testid="product-price"]').should('be.visible');
      cy.get('[data-testid="product-description"]').should('be.visible');
      cy.get('[data-testid="product-thumbnail"]').should('be.visible');
      cy.get('[data-testid="product-warranty"]').should('be.visible').and('have.value', '30');
      cy.get('[data-testid="product-max-claim"]').should('be.visible').and('have.value', '2');
      cy.get('[data-testid="toggle-variations"]').should('be.visible').and('not.be.checked');
      cy.get('[data-testid="variations-container"]').should('not.exist');
      cy.get('[data-testid="submit-button"]').scrollIntoView().should('be.visible');
      cy.get('[data-testid="cancel-button"]').scrollIntoView().should('be.visible');
    });

    it('should show browser validation errors if required fields are missing on submit', () => {
      cy.get('[data-testid="submit-button"]').scrollIntoView().click();
      cy.get('[data-testid="product-name"]').should('match', ':invalid');
      
      cy.get('[data-testid="product-name"]').type('Product Tanpa Kategori');
      cy.get('[data-testid="submit-button"]').scrollIntoView().click();
      cy.get('[data-testid="product-category"]').should('match', ':invalid');
    });

    it('should toggle variations UI and hide parent fields appropriately', () => {
      cy.get('[data-testid="toggle-variations"]').check();
      cy.get('[data-testid="variations-container"]').should('be.visible');
      
      cy.get('[data-testid="product-price"]').should('not.exist');
      cy.get('[data-testid="product-warranty"]').should('not.exist');
      cy.get('[data-testid="product-max-claim"]').should('not.exist');

      cy.get('[data-testid="variation-row-0"]').should('be.visible');
      cy.get('[data-testid="var-name-0"]').should('be.visible');
      cy.get('[data-testid="var-price-0"]').should('be.visible');
    });

    it('should allow adding and removing variation rows', () => {
      cy.get('[data-testid="toggle-variations"]').check();
      
      cy.get('[data-testid="add-variation"]').scrollIntoView().click();
      cy.get('[data-testid="variation-row-1"]').should('be.visible');
      
      cy.get('[data-testid="var-remove-0"]').click();
      
      cy.get('[data-testid^="variation-row-"]').should('have.length', 1);
      cy.get('[data-testid^="var-remove-"]').should('be.disabled');
    });

    it('should successfully create a standard product without variations', () => {
      const productName = `Std Prod ${Date.now()}`;
      cy.get('[data-testid="product-name"]').type(productName);
      
      cy.get('[data-testid="product-category"]').select(1);
      
      cy.get('[data-testid="product-price"]').type('50000');
      cy.get('[data-testid="product-description"]').type('Deskripsi produk standar untuk E2E testing.');
      cy.get('[data-testid="product-thumbnail"]').type('https://example.com/image.png');
      
      cy.get('[data-testid="submit-button"]').scrollIntoView().click();

      cy.url().should('include', '/admin/products');
      
      // The new product should be listed
      cy.contains('td', productName).should('be.visible');
    });

    it('should successfully create a product with multiple variations', () => {
      const productName = `Var Prod ${Date.now()}`;
      cy.get('[data-testid="product-name"]').type(productName);
      cy.get('[data-testid="product-category"]').select(1);
      cy.get('[data-testid="product-description"]').type('Produk dengan variasi.');
      
      cy.get('[data-testid="toggle-variations"]').check();

      cy.get('[data-testid="var-name-0"]').type('1 Bulan');
      cy.get('[data-testid="var-price-0"]').type('25000');
      
      cy.get('[data-testid="add-variation"]').scrollIntoView().click();
      cy.get('[data-testid="var-name-1"]').type('3 Bulan');
      cy.get('[data-testid="var-price-1"]').type('65000');
      cy.get('[data-testid="var-warranty-1"]').clear().type('90');
      cy.get('[data-testid="var-max-claim-1"]').clear().type('5');

      cy.get('[data-testid="submit-button"]').scrollIntoView().click();

      cy.url().should('include', '/admin/products');
      
      // The new product should be listed
      cy.contains('td', productName).should('be.visible');
    });
  });

  context('Mobile View', () => {
    beforeEach(() => {
      cy.viewport('iphone-8'); // 375x667
    });

    it('should display the form correctly without overlapping buttons', () => {
      cy.get('[data-testid="cancel-button"]').scrollIntoView().should('be.visible');
      cy.get('[data-testid="submit-button"]').scrollIntoView().should('be.visible');
      
      cy.get('[data-testid="cancel-button"]').should('have.class', 'w-full');
      cy.get('[data-testid="submit-button"]').should('have.class', 'w-full');
      
      cy.get('[data-testid="toggle-variations"]').scrollIntoView().check();
      cy.get('[data-testid="variation-row-0"]').should('be.visible');
      cy.get('[data-testid="var-name-0"]').should('be.visible');
      cy.get('[data-testid="add-variation"]').scrollIntoView().should('be.visible');
    });

    it('should allow creating a product safely on mobile', () => {
      const productName = `Mob Prod ${Date.now()}`;
      cy.get('[data-testid="product-name"]').type(productName);
      cy.get('[data-testid="product-category"]').select(1);
      
      cy.get('[data-testid="toggle-variations"]').scrollIntoView().check();
      cy.get('[data-testid="var-name-0"]').type('Premium');
      cy.get('[data-testid="var-price-0"]').type('150000');
      
      cy.get('[data-testid="submit-button"]').scrollIntoView().click();

      cy.url().should('include', '/admin/products');
      cy.contains('td', productName).should('be.visible');
    });
  });
});
