describe('Admin Categories Management - Exhaustive Testing', () => {
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
    // DB is reset externally
  });

  describe('Desktop View', () => {
    beforeEach(() => {
      cy.viewport(1280, 720); // Default Desktop
      loginAdmin();
      cy.visit('/admin/categories');
    });

    it('should display the categories page with correct UI elements', () => {
      cy.get('h1').contains('Categories').should('be.visible');
      cy.get('h2').contains('Add New Category').should('be.visible');
      cy.get('[data-testid="category-name-input"]').should('be.visible');
      cy.get('[data-testid="category-slug-input"]').should('be.visible');
      cy.get('[data-testid="add-category-button"]').should('be.visible');
      cy.get('table').should('be.visible');
    });

    it('should show the default dummy categories', () => {
      cy.get('[data-testid="category-row"]').should('have.length.at.least', 3);
      cy.get('[data-testid="category-name"]').contains('Streaming').should('be.visible');
      cy.get('[data-testid="category-name"]').contains('Design').should('be.visible');
      cy.get('[data-testid="category-name"]').contains('VPN').should('be.visible');
    });

    it('should require name and slug to create a category', () => {
      // Inputs should have required attribute
      cy.get('[data-testid="category-name-input"]').should('have.attr', 'required');
      cy.get('[data-testid="category-slug-input"]').should('have.attr', 'required');
    });

    it('should create a new category successfully', () => {
      const newCategoryName = 'Software Tools';
      const newCategorySlug = 'software-tools';

      cy.get('[data-testid="category-name-input"]').type(newCategoryName);
      cy.get('[data-testid="category-slug-input"]').type(newCategorySlug);
      cy.get('[data-testid="add-category-button"]').click();

      // Check if it appears in the list
      cy.get('[data-testid="category-name"]').contains(newCategoryName).should('be.visible');
      cy.get('[data-testid="category-slug"]').contains(newCategorySlug).should('be.visible');
    });

    it('should delete a category that has products (Streaming)', () => {
      cy.contains('td', 'Streaming').parent().as('streamingRow');
      cy.get('@streamingRow').find('[data-testid^="delete-category-"]').click();

      // Ensure modal appears
      cy.get('button').contains('Ya, Hapus').click();

      // Expected behavior: it deletes the category and its products
      cy.contains('td', 'Streaming').should('not.exist');
    });

    it('should delete a category with no products', () => {
      // Create a temporary category just to delete it, so tests can run in any order safely,
      // but since we are running sequentially, 'Software Tools' is already created.
      // However, to be completely isolated, let's create a specific one to delete.
      const tempCat = 'Temp Cat Desktop';
      const tempSlug = 'temp-cat-desktop';

      cy.get('[data-testid="category-name-input"]').type(tempCat);
      cy.get('[data-testid="category-slug-input"]').type(tempSlug);
      cy.get('[data-testid="add-category-button"]').click();
      cy.get('[data-testid="category-name"]').contains(tempCat).should('be.visible');

      // Delete it
      cy.get(`[data-testid="delete-category-${tempSlug}"] button`).click();
      cy.get('button').contains('Ya, Hapus').click();
      
      // Give it a moment to revalidate
      cy.get('[data-testid="category-name"]').contains(tempCat).should('not.exist');
    });
  });

  describe('Mobile View', () => {
    beforeEach(() => {
      cy.viewport('iphone-x'); // 375x812
      loginAdmin();
      cy.visit('/admin/categories');
    });

    it('should display the create form without overlapping', () => {
      cy.get('h1').contains('Categories').should('be.visible');
      cy.get('[data-testid="category-name-input"]').should('be.visible');
      cy.get('[data-testid="category-slug-input"]').should('be.visible');
      
      // The add button should be visible
      cy.get('[data-testid="add-category-button"]').should('be.visible').and('not.be.disabled');
    });

    it('should allow creating and deleting a category on mobile', () => {
      const mobileCat = 'Mobile Category';
      const mobileSlug = 'mobile-cat';

      cy.get('[data-testid="category-name-input"]').type(mobileCat);
      cy.get('[data-testid="category-slug-input"]').clear().type(mobileSlug); 
      cy.get('[data-testid="add-category-button"]').click();

      // Check overflow scrolling
      cy.get('.overflow-x-auto').scrollTo('right', { ensureScrollable: false });
      cy.get(`[data-testid="delete-category-${mobileSlug}"] button`).should('be.visible').click();
      cy.get('button').contains('Ya, Hapus').click();

      // Ensure it's deleted
      cy.get('[data-testid="category-name"]').contains(mobileCat).should('not.exist');
    });
  });
});
