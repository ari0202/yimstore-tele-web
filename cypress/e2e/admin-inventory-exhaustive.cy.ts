/// <reference types="cypress" />

describe('Admin Inventory Management - Exhaustive Testing', () => {
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
    // Database has been seeded with standard products by the external runner script
  });

  beforeEach(() => {
    loginAdmin();
    cy.visit('/admin/inventory');
    cy.url().should('include', '/admin/inventory');
  });

  context('Desktop View', () => {
    beforeEach(() => {
      cy.viewport(1280, 720); // Desktop viewport
    });

    it('should display the initial UI elements correctly and disable upload on empty', () => {
      cy.contains('h1', 'Bulk Inventory Upload').should('be.visible');
      cy.get('[data-testid="product-select"]').should('be.visible');
      cy.get('[data-testid="credentials-input"]').should('be.visible');
      
      // Upload button should exist and be disabled because form is empty
      cy.get('[data-testid="upload-button"]').should('be.visible').and('be.disabled');
    });

    it('should validate form inputs to enable upload button', () => {
      // Type credentials, but no product selected
      cy.get('[data-testid="credentials-input"]').type('user1@example.com:pass123');
      cy.get('[data-testid="upload-button"]').should('be.disabled');

      // Select product, but empty credentials
      cy.get('[data-testid="credentials-input"]').clear();
      // Select the first real product (ignoring the default empty option)
      cy.get('[data-testid="product-select"] > option').eq(1).then(($option) => {
        const productVal = $option.val();
        cy.get('[data-testid="product-select"]').select(productVal as string);
      });
      cy.get('[data-testid="upload-button"]').should('be.disabled');

      // Fill both
      cy.get('[data-testid="credentials-input"]').type('user1@example.com:pass123');
      cy.get('[data-testid="upload-button"]').should('not.be.disabled');
    });

    it('should successfully upload bulk credentials to a product', () => {
      // Create a unique dummy credential
      const uniqueCred1 = `e2e_user_${Date.now()}_1@example.com:pass123`;
      const uniqueCred2 = `e2e_user_${Date.now()}_2@example.com:pass123`;
      const bulkText = `${uniqueCred1}\n${uniqueCred2}\n`;

      cy.get('[data-testid="product-select"] > option').eq(1).then(($option) => {
        const productVal = $option.val();
        cy.get('[data-testid="product-select"]').select(productVal as string);
      });
      
      cy.get('[data-testid="credentials-input"]').type(bulkText);
      cy.get('[data-testid="upload-button"]').click();

      // Check for progress or success message
      cy.get('[data-testid="upload-status"]').should('contain', 'Successfully uploaded 2 credentials');

      // Verify that the textarea was cleared
      cy.get('[data-testid="credentials-input"]').should('have.value', '');

      // Navigate to Available Inventory to verify
      cy.visit('/admin/inventory/available');

      // Wait for table to load
      cy.get('[data-testid="expand-group-button"]', { timeout: 10000 }).should('exist');

      // Expand all product accordions so the table rows become visible
      cy.get('[data-testid="expand-group-button"]').click({ multiple: true, force: true });

      // Verify they appear in the available inventory table
      cy.contains('td', uniqueCred1).should('be.visible');
      cy.contains('td', uniqueCred2).should('be.visible');
    });

    it('should be able to delete a specific credential from inventory', () => {
      // Add a single credential specific for deletion
      const deleteCred = `delete_me_${Date.now()}@test.com:deleted`;
      
      cy.get('[data-testid="product-select"] > option').eq(1).then(($option) => {
        const productVal = $option.val();
        cy.get('[data-testid="product-select"]').select(productVal as string);
      });
      cy.get('[data-testid="credentials-input"]').type(deleteCred);
      cy.get('[data-testid="upload-button"]').click();

      // Wait for upload success
      cy.get('[data-testid="upload-status"]').should('be.visible');

      // Navigate to Available Inventory to verify and delete
      cy.visit('/admin/inventory/available');

      // Wait for table to load
      cy.get('[data-testid="expand-group-button"]', { timeout: 10000 }).should('exist');

      // Expand all product accordions
      cy.get('[data-testid="expand-group-button"]').click({ multiple: true, force: true });

      // The new cred should be visible in the list
      cy.contains('td', deleteCred).parent('tr').within(() => {
        // Look for the delete button inside this specific row
        cy.get('button[title="Delete Credential"]').click();
      });

      // The row should be removed from the table asynchronously
      cy.contains('td', deleteCred).should('not.exist');
    });
  });

  context('Mobile View', () => {
    beforeEach(() => {
      cy.viewport('iphone-8'); // 375x667
    });

    it('should render forms and table correctly without overflow cropping', () => {
      cy.get('[data-testid="product-select"]').scrollIntoView().should('be.visible');
      cy.get('[data-testid="credentials-input"]').scrollIntoView().should('be.visible');
      cy.get('[data-testid="upload-button"]').scrollIntoView().should('be.visible');

      // The button should take up the full width on mobile or flow correctly
      cy.get('[data-testid="upload-button"]').should('have.class', 'w-full');
    });

    it('should be able to upload securely on mobile', () => {
      const mobileCred = `mobile_${Date.now()}@example.com:pass`;
      
      cy.get('[data-testid="product-select"] > option').eq(1).then(($option) => {
        const productVal = $option.val();
        cy.get('[data-testid="product-select"]').select(productVal as string);
      });
      cy.get('[data-testid="credentials-input"]').type(mobileCred);
      cy.get('[data-testid="upload-button"]').scrollIntoView().click();

      cy.get('[data-testid="upload-status"]').scrollIntoView().should('contain', 'Successfully uploaded 1 credentials');
      
      // Navigate to Available Inventory to verify
      cy.visit('/admin/inventory/available');

      // Wait for table to load
      cy.get('[data-testid="expand-group-button"]', { timeout: 10000 }).should('exist');

      // Expand all product accordions so the table rows become visible
      cy.get('[data-testid="expand-group-button"]').click({ multiple: true, force: true });

      // Look for the element in the list
      cy.contains('td', mobileCred).scrollIntoView().should('be.visible');
    });
  });
});
