import { Page, Browser, ElementHandle } from "puppeteer";
import { Sale } from "./Sale";
import { debug } from "./utils";

/**
 * The home page of our TicketSwap instance
 */
export class HomePage {
  /**
   * The puppeteer browser used to create pages
   */
  private readonly _browser: Browser;
  /**
   * The URL of the home page
   */
  private readonly _url: string;

  /**
   * Creates a new HomePage
   * @param browser The puppeteer browser used to create pages
   * @param url The URL of the home page
   */
  constructor (browser: Browser, url: string) {
    this._browser = browser;
    this._url = url;
  }

  /**
   * The Page instance used for the HomePage
   */
  private _page: Page;
  /**
   * Lazy getter for the instance of the Page
   */
  private async _getPage () {
    if (!this._page) {
      this._page = await this._browser.newPage();
      await this._page.goto(this._url);
    }
    return this._page;
  }

  /**
   * If the cookies have already been accepted
   */
  private _cookiesAccepted: boolean = false;
  /**
   * Lazy getter for the acceptance of the cookies
   */
  async acceptCookies () {
    if (!this._cookiesAccepted) {
      const page = await this._getPage();
      const cookieBtnSelector = '#__next > div > div > button';
      const cookiesBtn = await page.$(cookieBtnSelector);
      if (await page.$(`${cookieBtnSelector} > span > svg > path`) === null || cookiesBtn === null) {
        await debug(page, 'CookiesError');
        throw new Error(`The cookie panel is not where it should be`)
      }
      await cookiesBtn.click();
      this._cookiesAccepted = true;
      try {
        await page.waitForSelector(`${cookieBtnSelector} > span > svg > path`, { hidden: true });
      }
      catch (e) {
        await debug(page, 'CookiesTimeoutError');
        throw e;
      }
    }
  }

  /**
   * Creates a new account
   * @param email The email address to use
   * @param givenName The first name to use
   * @param familyName The family name to use
   */
  async createAccount (email: string, givenName: string, familyName: string) {
    const page = await this._getPage();

    const menuButtons = await page.$$('#__next nav > ul > li > button');
    const menuButtonContent = await Promise.all(menuButtons.map((button: ElementHandle) => button.evaluate((node: HTMLButtonElement) => node.innerText)));
    const connectionButtonIndex = menuButtonContent.findIndex((value) => value === 'Connecte-toi');
    if (connectionButtonIndex === -1) {
      throw new Error(`The connection button is not where it should be`);
    }
    const connectMenuButton = menuButtons[connectionButtonIndex];
    if (connectMenuButton === null) {
      throw new Error(`The connection button is not where it should be`);
    }
    await connectMenuButton.click();
    try {
      await page.waitForSelector('div[data-testid=dialog-overlay] #email', { visible: true });
    }
    catch (e) {
      await debug(page, 'CreateAccountOpenModalTimeoutError');
      throw e;
    }

    const emailField = await page.$('div[data-testid=dialog-overlay] #email');
    if (emailField === null) {
      throw new Error(`The email field is not where it should be`);
    }
    await emailField.type(email);
    const emailBtn = await page.$('div[data-testid=dialog-overlay] form button[type=submit]')
    if (emailBtn === null) {
      throw new Error(`The email validation button is not where it should be`);
    }
    await emailBtn.click();
    try {
      await page.waitForSelector('div[data-testid=dialog-overlay] #email', { hidden: true });
    }
    catch (e) {
      await debug(page, 'CreateAccountHideEmailTimeoutError');
      throw e;
    }

    try {
      await page.waitForSelector('div[data-testid=dialog-overlay] #firstname', { visible: true });
    }
    catch (e) {
      await debug(page, 'CreateAccountShowFirstNameTimeoutError');
      throw e;
    }
    const givenNameField = await page.$('div[data-testid=dialog-overlay] #firstname');
    if (givenNameField === null) {
      throw new Error(`The first name field is not where it should be`);
    }
    const familyNameField = await page.$('div[data-testid=dialog-overlay] #lastname');
    if (familyNameField === null) {
      throw new Error(`The family name field is not where it should be`);
    }
    await givenNameField.type(givenName);
    await familyNameField.type(familyName);
    const subscribeBtn = await page.$('div[data-testid=dialog-overlay] form button[type=submit]')
    if (subscribeBtn === null) {
      throw new Error(`The subscribe button is not where it should be`);
    }
    try {
      await Promise.all([
        page.waitForSelector('div[data-testid=dialog-overlay]', { hidden: true }),
        subscribeBtn.click(),
      ]);
    }
    catch (e) {
      await debug(page, 'ValidateTimeoutError');
      throw e;
    }
  }

  /**
   * If there are available sales
   */
  async areSalesAvailable (): Promise<boolean> {
    const page = await this._getPage();
    const elt = await page.$('#tickets [data-testid=available-h2]');
    return elt !== null;
  }

  /**
   * The list of available Sales
   */
  private _sales: Sale[];
  /**
   * Lazy getter for the available Sales
   */
  async getSales (): Promise<Sale[]> {
    if (!this._sales) {
      const page = await this._getPage();
      const container = await page.$('#tickets > div > ul');
      if (container === null) {
        await debug(page, 'SalesContainerError');
        throw new Error(`The sales container is not where it should be`);
      }
      const children = await container.$$('div > a');
      if (children.length === 0) {
        await debug(page, 'SalesChildrenError');
        throw new Error(`There are no sales`);
      }
      this._sales = children.map((child) => new Sale(this._browser, child))
    }
    return this._sales;
  }

  /**
   * Fetches the cheapest sale
   */
  async getCheapestSale (): Promise<Sale> {
    const sales = await this.getSales();
    const salePrices = await Promise.all(sales.map(async (sale) => await sale.getPrice()));
    const cheapestIndex = salePrices.reduce((prev, curr, index, array) => {
      return curr < array[prev] ? index : prev;
    }, 0);
    return sales[cheapestIndex];
  }

  /**
   * Deletes the open sales and reloads the page
   */
  async reload () {
    const page = await this._getPage();
    if (this._sales) {
      await Promise.all(this._sales.map((sale) => sale.close()));
      this._sales = null;
    }
    await page.reload();
  }
}
