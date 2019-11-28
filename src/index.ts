import puppeteer from 'puppeteer';
import { TicketSwap } from './TicketSwap';
import { rand } from './utils';

import {
  URL,
  ACCOUNT_CREATED,
  EMAIL,
  GIVEN_NAME,
  FAMILY_NAME,
  CONNECTION_LINK,
  MAX_PRICE,
  TICKETS_COUNT,
  RETRY_DELAY_MS_MIN,
  RETRY_DELAY_MS_MAX
} from './config'

(async () => {
  // Launches Browser instance
  const browser = await puppeteer.launch();

  try {
    // Config integrity check
    if (ACCOUNT_CREATED === false) {
      if (EMAIL === '' || GIVEN_NAME === '' || FAMILY_NAME === '') {
        throw new Error(`EMAIL, GIVEN_NAME et FAMILY_NAME have to be filled if the account doesn't exist.`);
      }
    }
    else if (CONNECTION_LINK === '') {
      throw new Error(`CONNECTION_LINK has to be filled if the account exists.`);
    }
    if (URL === '') {
      throw new Error(`URL must be filled.`);
    }
    if (MAX_PRICE === 0) {
      throw new Error(`MAX_PRICE must be filled.`);
    }
    if (TICKETS_COUNT === 0) {
      throw new Error(`TICKETS_COUNT must be filled.`);
    }

    /**
     * The number of tickets left to buy
     */
    let ticketsLeft = TICKETS_COUNT;

    /**
     * The instance of TicketSwap
     */
    const ts = new TicketSwap(URL, browser);

    // Accept cookies to clear space and allow authentication
    await ts.acceptCookies();

    // If the account isn't created, creates it to retrieve the cookies
    if (ACCOUNT_CREATED === false) {
      console.log(`Creating account`);
      await ts.createAccount(EMAIL, GIVEN_NAME, FAMILY_NAME);
    }
    // If the account is already created, opens the connection link that provides the cookies
    else {
      console.log(`Using connection link`);
      await ts.openConnectionLink(CONNECTION_LINK);
    }

    // Loop runs while there are still tickets to buy
    while (ticketsLeft > 0) {
      console.log(`There are ${ticketsLeft} ticket(s) left to buy`);
      // If sales are available, analyzes them
      if (await ts.areSalesAvailable()) {
        const sales = await ts.getSales();
        const salePrices = await Promise.all(sales.map(async (sale) => await sale.getPrice()));
        console.log(`There are ${sales.length} available sales:`)
        for (const salePrice of salePrices) {
          console.log(`${salePrice}€`);
        }
        const cheapestSale = await ts.getChepestSale();
        const cheapestPrice = await cheapestSale.getPrice();
        console.log(`Cheapest sale: ${cheapestPrice}€`);
        // If the lowest price sale is acceptable, purchases the ticket(s)
        if (cheapestPrice <= MAX_PRICE) {
          // Selects the tickets to purchase
          const ticketsToPurchase = await cheapestSale.select(ticketsLeft);
          console.log(`${ticketsToPurchase} ticket(s) bought in this sale`);
          // Adds them into the cart
          await cheapestSale.checkout();
          // Substracts the amount of purchased tickets from the amount of tickets to purchase
          ticketsLeft -= ticketsToPurchase;
        }
        else {
          console.log('The tickets are too expensive');
        }
      }
      else {
        console.log(`There are no sales available`);
      }
      // If there are still tickets to purchase, waits a random time, reloads the page and retries
      if (ticketsLeft > 0) {
        const delay = rand(RETRY_DELAY_MS_MIN, RETRY_DELAY_MS_MAX);
        console.log(`Next try in ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        await ts.reload();
      }
    }
  }
  catch (e) {
    console.error(e);
  }
  // Closes the browser to end the program
  await browser.close();
})()