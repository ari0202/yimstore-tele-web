describe('Admin Management Exhaustive Cases', () => {
  const adminCredentials = { username: 'bryannv', password: 'Sakithatiku02' };
  const viewports: Cypress.ViewportPreset[] = ['macbook-15', 'iphone-x'];

  before(() => {
    // Revalidate caches and clear data
    cy.request({
      method: 'POST',
      url: '/api/test/seed-admin',
      headers: { 'x-e2e-bypass': Cypress.env('E2E_BYPASS_SECRET') || 'e2e-bypass-2024' },
      failOnStatusCode: false
    });
  });

  viewports.forEach((viewport) => {
    context(`Viewport: ${viewport}`, () => {
      let categoryId: string;
      let consumerTelegramId: string;
      let consumerId: string;
      
      beforeEach(() => {
        cy.viewport(viewport);
        // Seed category and user for this viewport test
        cy.request({
          method: 'POST',
          url: '/api/test/seed-admin',
          headers: { 'x-e2e-bypass': Cypress.env('E2E_BYPASS_SECRET') || 'e2e-bypass-2024' }
        }).then((res) => {
          expect(res.status).to.eq(200);
          categoryId = res.body.categoryId;
          consumerId = res.body.consumerId;
          consumerTelegramId = res.body.consumerTelegramId;
        });

        // Admin login via UI with bypass header
        cy.intercept('**', (req) => {
          req.headers['x-e2e-bypass'] = Cypress.env('E2E_BYPASS_SECRET') || 'e2e-bypass-2024';
        });
        cy.visit('/admin/login');
        cy.get('input[name="username"]').type(adminCredentials.username);
        cy.get('input[name="password"]').type(adminCredentials.password);
        cy.get('button[type="submit"]').click();
        cy.url().should('not.include', '/login');
      });

      it('1. Should create a simple product and Hard Delete it', () => {
        const prodName = `E2E-TEST-Simple-${viewport}`;
        cy.visit('/admin/products/add');
        
        // Fill form
        cy.get('input[name="name"]').type(prodName);
        cy.get('select[name="category_id"]').select(categoryId);
        cy.get('input[name="price"]').type('15000');
        cy.get('button[type="submit"]').contains('Simpan Produk').click();
        
        // Verify creation
        cy.url().should('include', '/admin/products');
        cy.contains(prodName).should('be.visible');

        // Edit the product name
        cy.contains('tr', prodName).find('button[title="Edit Product"]').click();
        cy.get('input[name="name"]').clear().type(`${prodName}-Edited`);
        cy.get('button[type="submit"]').contains('Save Changes').click();
        cy.contains(`${prodName}-Edited`).should('be.visible');

        // Hard Delete
        cy.contains('tr', `${prodName}-Edited`).find('button[title="Hapus Produk"]').click();
        cy.contains(`${prodName}-Edited`).should('not.exist');
      });

      it('2. Should create product with variations, manage inventory, and test checkout limits', () => {
        const parentName = `E2E-TEST-Parent-${viewport}`;
        const timestamp = Date.now();
        const varName = `1 Bulan-${viewport}-${timestamp}`;
        
        // 2a. Create Product with Variations
        cy.visit('/admin/products/add');
        cy.get('input[name="name"]').type(parentName);
        cy.get('select[name="category_id"]').select(categoryId);
        
        // Check "Aktifkan Variasi"
        cy.contains('Aktifkan Variasi').click();
        
        // Fill Variation
        cy.get('input[placeholder="misal: 1 Bulan"]').first().type(varName);
        // Find price input in variation row (second input in the row)
        cy.get('.grid-cols-1.md\\:grid-cols-12 input[type="number"]').eq(0).clear().type('25000'); // Price
        cy.get('.grid-cols-1.md\\:grid-cols-12 input[type="number"]').eq(1).clear().type('30'); // Warranty
        cy.get('.grid-cols-1.md\\:grid-cols-12 input[type="number"]').eq(2).clear().type('2'); // Max Claim Limit

        cy.get('button[type="submit"]').contains('Simpan Produk').click();
        
        cy.url().should('include', '/admin/products');
        cy.contains(parentName).should('be.visible');

        // 2b. Edit Variation
        cy.contains('tr', parentName).find('button[title="Manage Variations"]').click();
        // Since modal opens, find the inline edit button
        cy.get('.fixed.inset-0').contains('Variasi').should('be.visible');
        cy.get('.fixed.inset-0').find('button[title="Edit Variasi"]').first().click();
        cy.get('.fixed.inset-0').find('input[name="name"]').last().clear().type(`${varName}-Edited`);
        cy.get('.fixed.inset-0').find('button').contains('Save').click();
        cy.get('.fixed.inset-0').contains(`${varName}-Edited`).should('be.visible');
        // Close modal
        cy.get('.fixed.inset-0').find('button').first().click();

        // 2c. Bulk Upload Inventory
        cy.visit('/admin/inventory');
        // Find the specific variation in the select dropdown
        cy.get('select').select(`${varName}-Edited`);
        cy.get('textarea').type(`E2E-CRED-${timestamp}-1\nE2E-CRED-${timestamp}-2\nE2E-CRED-${timestamp}-3\nE2E-CRED-${timestamp}-4`);
        cy.get('button').contains('Upload Data').click();
        cy.contains('Successfully uploaded 4 credentials', { timeout: 10000 }).should('be.visible');

        // 2d. Delete one inventory via Action
        // Find E2E-CRED-${timestamp}-4 and delete it
        cy.contains('tr', `E2E-CRED-${timestamp}-4`).find('button[title="Delete Inventory"]').click({ force: true });
        cy.contains(`E2E-CRED-${timestamp}-4`).should('not.exist');

        // 2e. Test Checkout Limit (Consumer Flow)
        // First we need the variation ID. We can grab its value from the <select> element in the inventory page
        cy.get('select').find(`option:contains("${varName}-Edited")`).invoke('val').then((variationId) => {
          
          // Execute Checkout via API
          cy.request({
            method: 'POST',
            url: '/api/checkout',
            headers: {
              'x-e2e-bypass': Cypress.env('E2E_BYPASS_SECRET') || 'e2e-bypass-2024'
            },
            body: { productId: variationId },
            form: true,
            followRedirect: false
          }).then((res) => {
            expect(res.status).to.eq(303);
            const location = res.headers.location as string;
            const match = location.match(/order_id=([a-zA-Z0-9-]+)/);
            const orderId = match ? match[1] : undefined;
            expect(orderId).to.not.be.undefined;

            let token = 'dummy';
            const cookies = res.headers['set-cookie'] as string[] | undefined;
            if (cookies) {
              const tokenCookie = cookies.find(c => c.includes('order_token_'));
              if (tokenCookie) {
                token = tokenCookie.split('=')[1].split(';')[0];
              }
            }

            // Simulate Webhook to mark PAID
            const webhookPayload = {
              order_id: orderId,
              status: 'PAID',
              amount: 25000,
              transaction_id: `txn_${Date.now()}`
            };
            cy.task('generatePakasirSignature', { 
              payload: webhookPayload, 
              secret: Cypress.env('PAKASIR_HMAC_SECRET') || '[YOUR_PAKASIR_WEBHOOK_SECRET_KEY]' 
            }).then((signature) => {
              cy.request({
                method: 'POST',
                url: '/api/webhook',
                headers: { 'x-pakasir-signature': signature as string },
                body: webhookPayload
              }).then(() => {
                
                // Now order is PAID, we have 1 order_item. We need its ID to claim.
                // We can query the database directly or use an API. 
                // Since Cypress runs in browser, we can just use the Admin API to get the order item, but let's just make a small script or we can just fetch from DB using supabase client if exposed.
                // Wait, seed-admin doesn't return orderItemId. Let's just create a quick task or use the bypass claim.
                // Actually, since this is E2E, we can visit the public order page and extract it, but we didn't mock the consumer cookie.
                // Let's just visit the return URL to get the cookie!
                cy.visit(`/order/${orderId}?token=${token}`);
                cy.get('button[data-item-id]', { timeout: 10000 }).should('be.visible').invoke('attr', 'data-item-id').then((orderItemId) => {
                  expect(orderItemId).to.not.be.undefined;

                  // Claim 1 (Should Succeed)
                  cy.request({
                    method: 'POST',
                    url: '/api/claim',
                    body: { orderItemId, access_token: token },
                    failOnStatusCode: false
                  }).then((claim1) => {
                    expect([200, 202]).to.include(claim1.status);

                    // Admin Bypass Cooldown for Claim 2
                    cy.request({
                      method: 'POST',
                      url: '/api/admin/claims/bypass',
                      body: { orderItemId }
                    }).then(() => {
                      
                      // Claim 2 (Should Succeed because max_claim_limit = 2)
                      cy.request({
                        method: 'POST',
                        url: '/api/claim',
                        body: { orderItemId, access_token: token },
                        failOnStatusCode: false
                      }).then((claim2) => {
                        expect([200, 202]).to.include(claim2.status);

                        // Admin Bypass Cooldown for Claim 3
                        cy.request({
                          method: 'POST',
                          url: '/api/admin/claims/bypass',
                          body: { orderItemId }
                        }).then(() => {
                          
                          // Claim 3 (Should Fail with 403 Claim limit reached)
                          cy.request({
                            method: 'POST',
                            url: '/api/claim',
                            body: { orderItemId, access_token: token },
                            failOnStatusCode: false
                          }).then((claim3) => {
                            expect(claim3.status).to.eq(403);
                            expect(claim3.body.error).to.include('Claim limit reached');
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });

    });
  });
});
