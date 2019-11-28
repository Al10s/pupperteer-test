import { ElementHandle, Browser, Page } from "puppeteer";
import { debug, screenshot } from "./utils";

/**
 * A Sale that is in progress
 */
export class Sale {
  /**
   * The puppeteer browser used to create pages
   */
  private readonly _browser: Browser;
  /**
   * The element handle representing the link to this sale
   */
  private readonly _handle: ElementHandle;

  /**
   * Creates a new Sale
   * @param browser The puppeteer browser used to create pages
   * @param handle The element handle representing the link to this sale
   */
  constructor (browser: Browser, handle: ElementHandle) {
    this._browser = browser;
    this._handle = handle;
  }

  /**
   * The fields present in the handle
   */
  private _fields: ElementHandle[];
  /**
   * Lazy getter for the fields present in the handle
   */
  private async _getHomePageFields (): Promise<ElementHandle[]> {
    if (!this._fields) {
      this._fields = await this._handle.$$('footer > div');
      if (this._fields.length !== 2) {
        throw new Error(`There are ${this._fields.length} fields in this sale. Expected 2`);
      }
    }
    return this._fields;
  }

  /**
   * The auhtor of the sale
   */
  private _author: string;
  /**
   * Lazy getter for the author of the sale
   */
  async getAuthor (): Promise<string> {
    if (!this._author) {
      const fields = await this._getHomePageFields();
      this._author = await fields[0].evaluate((node: HTMLElement) => node.innerText);
    }
    return this._author;
  }

  /**
   * The price of each ticket in this Sale
   */
  private _price: number;
  /**
   * Lazy getter for the price of each ticket in this Sale
   */
  async getPrice (): Promise<number> {
    if (!this._price) {
      const fields = await this._getHomePageFields();
      const text = await fields[1].evaluate((node: HTMLElement) => node.innerText);
      if (text[0] !== '€') {
        throw new Error(`Le premier caractère du prix devrait être "€". C'est "${text.charAt(0)}"`);
      }
      this._price = parseFloat(text.substr(1).replace('.', '').replace(',', '.'));
    }
    return this._price;
  }

  /**
   * The page where the Sale takes place
   */
  private _page: Page;
  /**
   * Lazy getter for the page where the Sale takes place
   */
  private async _getPage () {
    if (!this._page) {
      const href = await this._handle.evaluate((node: HTMLAnchorElement) => node.href);
      this._page = await this._browser.newPage();
      await this._page.goto(href);
    }
    return this._page;
  }

  /**
   * Selects at most the provided amount of tickets in this sale
   * @param count The maximum number of tickets to select
   */
  async select (count: number): Promise<number> {
    const page = await this._getPage();

    const tickets = await page.$$('#__next > div > div > div > form > div > div > div > div');
    if (tickets.length === 0) {
      await debug(page, 'SelectError');
      throw new Error('No ticket found in this sale')
    }
    const ticketsToSelect = tickets.length > count ? tickets.length - count : tickets.length;
    const ticketsToDeselect = tickets.length - ticketsToSelect;
    for (let i = 0; i < ticketsToDeselect; i ++) {
      await tickets[i].click();
    }
    return ticketsToSelect;
  }

  /**
   * Adds the selected tickets to the cart
   */
  async checkout () {
    const page = await this._getPage();

    const btn = await page.$('#__next > div > div > div > form > button');
    if (btn === null) {
      await debug(page, 'CheckoutError');
      throw new Error(`The checkout button is not where it should be`)
    }
    await Promise.all([
      page.waitForNavigation(),
      btn.click(),
    ]);
    await screenshot(page, `${+ new Date()}.png`);
  }

  /**
   * Closes the page
   */
  async close () {
    if (this._page) {
      await this._page.close();
    }
  }
}