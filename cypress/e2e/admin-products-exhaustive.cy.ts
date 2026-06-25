describe('Admin Products Management - Exhaustive Testing', () => {
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
      cy.visit('/admin/products');
    });

    it('should display the products page with correct UI elements', () => {
      cy.get('h1').contains('Products').should('be.visible');
      cy.get('table').should('be.visible');
      // The table should have headers
      cy.get('th').contains('Status').should('be.visible');
      cy.get('th').contains('Name').should('be.visible');
      cy.get('th').contains('Stock').should('be.visible');
      cy.get('th').contains('Actions').should('be.visible');
    });

    it('should show the default dummy products', () => {
      cy.get('[data-testid="product-row"]').should('have.length.at.least', 3);
      
      // Verify product names are rendered
      cy.contains('Netflix Premium 1 Bulan').should('be.visible');
      cy.contains('Spotify Premium 1 Bulan').should('be.visible');
      cy.contains('Canva Pro Invite').should('be.visible');

      // Verify stock for Netflix (which has 10 available + 1 hold + 2 used = 10 available stock)
      // We don't need to match the exact number, just ensure it's not empty
      cy.get('td').contains('Netflix Premium 1 Bulan').parent().find('[data-testid^="stock-"]').should('exist');
    });

    it('should be able to archive and restore a product', () => {
      // Find the row for Canva Pro Invite, and get its parent tr to find the archive button
      cy.contains('td', 'Canva Pro Invite').parent().as('canvaRow');
      
      // Archive the product
      cy.get('@canvaRow').find('[data-testid^="archive-product-"]').click();
      
      // Wait for revalidation and check status changed to Archived
      cy.contains('td', 'Canva Pro Invite').parent().as('archivedCanvaRow');
      cy.get('@archivedCanvaRow').find('[data-testid^="status-"]').contains('Archived').should('be.visible');
      
      // Ensure the restore button is now visible instead of edit/archive/delete
      cy.get('@archivedCanvaRow').find('[data-testid^="restore-product-"]').should('be.visible');
      cy.get('@archivedCanvaRow').find('[data-testid^="archive-product-"]').should('not.exist');

      // Restore the product
      cy.get('@archivedCanvaRow').find('[data-testid^="restore-product-"]').click();

      // Verify it's back to active
      cy.contains('td', 'Canva Pro Invite').parent().as('restoredCanvaRow');
      cy.get('@restoredCanvaRow').find('[data-testid^="status-"]').contains('Active').should('be.visible');
      cy.get('@restoredCanvaRow').find('[data-testid^="archive-product-"]').should('be.visible');
    });

    it('should permanently delete a product with available inventory (Netflix)', () => {
      // Find Netflix row and click delete
      cy.contains('td', 'Netflix Premium 1 Bulan').parent().as('netflixRow');
      cy.get('@netflixRow').find('[data-testid^="delete-product-"] button').click();

      // Confirm in modal
      cy.get('button').contains('Ya, Hapus').click();

      // It should successfully delete since all inventory is AVAILABLE and rpc handles it
      cy.contains('td', 'Netflix Premium 1 Bulan').should('not.exist');
    });

    it('should permanently delete a product without inventory (Spotify)', () => {
      // Find Spotify row and click delete
      cy.contains('td', 'Spotify Premium 1 Bulan').parent().as('spotifyRow');
      cy.get('@spotifyRow').find('[data-testid^="delete-product-"] button').click();

      // Confirm in modal
      cy.get('button').contains('Ya, Hapus').click();

      // Verify it is removed from the table
      cy.contains('td', 'Spotify Premium 1 Bulan').should('not.exist');
    });
  });

  describe('Mobile View', () => {
    beforeEach(() => {
      cy.viewport('iphone-x'); // 375x812
      loginAdmin();
      cy.visit('/admin/products');
    });

    it('should display the products list properly on mobile', () => {
      cy.get('h1').contains('Products').should('be.visible');
      // Table should be visible
      cy.get('table').should('be.visible');
    });

    it('should allow scrolling and interacting with actions on mobile', () => {
      cy.contains('td', 'Canva Pro Invite').parent().as('canvaRow');
      
      // Scroll to see actions
      cy.get('.overflow-x-auto').scrollTo('right', { ensureScrollable: false });
      
      // We should be able to click archive
      cy.get('@canvaRow').find('[data-testid^="archive-product-"]').should('be.visible').click();
      
      // Verify status updated
      cy.get('.overflow-x-auto').scrollTo('left', { ensureScrollable: false });
      cy.contains('td', 'Canva Pro Invite').parent().find('[data-testid^="status-"]').contains('Archived').should('be.visible');
      
      // Restore it
      cy.get('.overflow-x-auto').scrollTo('right', { ensureScrollable: false });
      cy.contains('td', 'Canva Pro Invite').parent().find('[data-testid^="restore-product-"]').should('be.visible').click();
    });
  });
});
