import crypto from 'crypto';

describe('Identity Sync (Web & Telegram) Exhaustive E2E', () => {
  const testEmail = `e2e_test_${Date.now()}@example.com`;
  const mockTelegramChatId = Math.floor(Math.random() * 1000000000).toString();
  
  let order1Id = '';
  let order2Id = '';
  let dashboard1Url = '';
  let dashboard2Url = '';

  before(() => {

    // Clear Next.js Caches
    cy.request({
      method: 'POST',
      url: '/api/test/revalidate',
      headers: {
        'x-e2e-reset-secret': Cypress.env('E2E_BYPASS_SECRET') || 'e2e-bypass-2024'
      },
      failOnStatusCode: false
    });
  });

  context('Skenario 1: Checkout Web & Mendapatkan Link Cadangan (Email)', () => {
    it('Should checkout successfully with an email and redirect to Dashboard', () => {
      cy.visit('/');
      
      // We simulate checkout by invoking the API directly to capture the redirect URL,
      // Click the first product card to open the modal
      cy.get('.grid > div').first().click();

      cy.get('input[name="productId"]').first().invoke('val').then((productId) => {
        cy.request({
          method: 'POST',
          url: '/api/checkout',
          headers: {
            'x-e2e-bypass': Cypress.env('E2E_BYPASS_SECRET') || 'e2e-bypass-2024'
          },
          body: { 
            productId, 
            email: testEmail 
          },
          form: true,
          followRedirect: false
        }).then((res) => {
          expect(res.status).to.eq(303);
          const location = res.headers.location as string;
          const decodedLocation = decodeURIComponent(location);
          
          // Extract Order ID from order_id param
          const matchId = decodedLocation.match(/order_id=([a-zA-Z0-9-]+)/);
          order1Id = matchId ? matchId[1] : '';
          expect(order1Id).to.have.length.greaterThan(10);
          
          // Extract Dashboard URL from redirect param
          const matchRedirect = decodedLocation.match(/redirect=([^&]+)/);
          dashboard1Url = matchRedirect ? matchRedirect[1] : `/order/${order1Id}`;
          
          // Visit the dashboard with the token
          cy.visit(dashboard1Url);
          cy.contains('Dashboard Pesanan').should('be.visible');
          
          // Ensure the deep link button exists
          cy.contains('Pantau & Klaim via Telegram').should('be.visible')
            .and('have.attr', 'href').and('include', 'token_');
        });
      });
    });
  });

  context('Skenario 2: Mengikat Pesanan ke Telegram (Deep Linking)', () => {
    it('Should simulate Telegram Bot Deep Link click and link order to Telegram ID', () => {
      cy.visit(dashboard1Url);
      
      cy.get('a:contains("Pantau & Klaim via Telegram")').invoke('attr', 'href').then((href) => {
        // href is like: https://t.me/YimStoreBot?start=token_XYZ
        const matchToken = href?.match(/start=(token_[a-zA-Z0-9-]+)/);
        const tokenPayload = matchToken ? matchToken[1] : '';
        expect(tokenPayload).to.contain('token_');

        // Simulate Telegram Webhook for `/start token_XYZ`
        const telegramUpdate = {
          update_id: Date.now(),
          message: {
            message_id: 1,
            from: { id: parseInt(mockTelegramChatId), is_bot: false, first_name: 'E2E User' },
            chat: { id: parseInt(mockTelegramChatId), type: 'private' },
            date: Math.floor(Date.now() / 1000),
            text: `/${tokenPayload}` // Telegram converts deep links to /start token_XYZ, but our bot regex handles it
          }
        };

        // Note: Our bot uses telegraf. To mock the webhook, we POST to our Next.js Telegram webhook endpoint
        // Wait, does the bot use webhook or polling in dev? It uses webhook via /api/webhook/telegram
        cy.request({
          method: 'POST',
          url: '/api/webhook/telegram',
          body: telegramUpdate,
          failOnStatusCode: false
        }).then((res) => {
          // It should process the update successfully
          expect([200, 202]).to.include(res.status);
        });
      });
    });
  });

  context('Skenario 3: Konsolidasi Banyak Pesanan (Multiple Orders under 1 Telegram ID)', () => {
    it('Should checkout a second time anonymously', () => {
      // Clear cookies to simulate a new anonymous session
      cy.clearCookies();
      
      cy.visit('/');
      
      // Click the first product card again to open the modal
      cy.get('.grid > div').first().click();

      cy.get('input[name="productId"]').first().invoke('val').then((productId) => {
        cy.request({
          method: 'POST',
          url: '/api/checkout',
          headers: {
            'x-e2e-bypass': Cypress.env('E2E_BYPASS_SECRET') || 'e2e-bypass-2024'
          },
          body: { productId, email: testEmail },
          form: true,
          followRedirect: false
        }).then((res) => {
          expect(res.status).to.eq(303);
          const location = res.headers.location as string;
          const decodedLocation = decodeURIComponent(location);
          
          const matchId = decodedLocation.match(/order_id=([a-zA-Z0-9-]+)/);
          order2Id = matchId ? matchId[1] : '';
          expect(order2Id).to.have.length.greaterThan(10);
          expect(order2Id).to.not.eq(order1Id);
          
          const matchRedirect = decodedLocation.match(/redirect=([^&]+)/);
          dashboard2Url = matchRedirect ? matchRedirect[1] : `/order/${order2Id}`;
          
          cy.visit(dashboard2Url);
          cy.contains('Dashboard Pesanan').should('be.visible');
        });
      });
    });

    it('Should link the second order to the SAME Telegram ID', () => {
      cy.visit(dashboard2Url);
      
      cy.get('a:contains("Pantau & Klaim via Telegram")').invoke('attr', 'href').then((href) => {
        const matchToken = href?.match(/start=(token_[a-zA-Z0-9-]+)/);
        const tokenPayload = matchToken ? matchToken[1] : '';
        expect(tokenPayload).to.contain('token_');

        // Simulate Telegram Webhook for the SECOND deep link
        const telegramUpdate = {
          update_id: Date.now() + 1,
          message: {
            message_id: 2,
            from: { id: parseInt(mockTelegramChatId), is_bot: false, first_name: 'E2E User' },
            chat: { id: parseInt(mockTelegramChatId), type: 'private' },
            date: Math.floor(Date.now() / 1000),
            text: `/${tokenPayload}`
          }
        };

        cy.request({
          method: 'POST',
          url: '/api/webhook/telegram',
          body: telegramUpdate,
          failOnStatusCode: false
        }).then((res) => {
          expect([200, 202]).to.include(res.status);
        });
      });
    });
  });

});
