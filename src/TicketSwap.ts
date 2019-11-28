import { Browser } from "puppeteer";
import { HomePage } from "./HomePage";
import { Sale } from "./Sale";

/**
 * The TicketSwap API
 */
export class TicketSwap {
  /**
   * The puppeteer browser used to create pages
   */
  private readonly _browser: Browser;
  /**
   * The URL of the home page
   */
  private readonly _homeUrl: string;

  /**
   * Creates a new TicketSwap
   * @param browser The puppeteer browser used to create pages
   * @param url The URL of the home page
   */
  constructor (homeUrl: string, browser: Browser) {
    this._homeUrl = homeUrl;
    this._browser = browser;
  }

  /**
   * The HomePage
   */
  private _homePage : HomePage;
  /**
   * Lazy getter for the HomePage
   */
  private async _getHomePage (): Promise<HomePage> {
    if (!this._homePage) {
      this._homePage = new HomePage(this._browser, this._homeUrl);
    }
    return this._homePage;
  }

  /**
   * Accepts the cookies on the HomePage
   */
  async acceptCookies () {
    const homePage = await this._getHomePage();
    await homePage.acceptCookies();
  }

  /**
   * Create a new account on the HomePage
   * @param email The email address to use
   * @param givenName The first name to use
   * @param familyName The family name to use
   */
  async createAccount (email: string, givenName: string, familyName: string) {
    const homePage = await this._getHomePage();
    await homePage.createAccount(email, givenName, familyName);
  }

  /**
   * Opens a new Page to the provided URL and closes it
   * @param connectionLink The connection URL
   */
  async openConnectionLink (connectionLink: string) {
    const page = await this._browser.newPage();
    await page.goto(connectionLink);
    await page.close();
  }

  /**
   * If there are available Sales
   */
  async areSalesAvailable (): Promise<boolean> {
    const homePage = await this._getHomePage();
    return homePage.areSalesAvailable();
  }

  /**
   * The available Sales
   */
  async getSales (): Promise<Sale[]> {
    const homePage = await this._getHomePage();
    return homePage.getSales();
  }

  /**
   * The cheapest Sale of the list
   */
  async getChepestSale (): Promise<Sale> {
    const homePage = await this._getHomePage();
    return homePage.getCheapestSale();
  }

  /**
   * Reloads the HomePage
   */
  async reload () {
    const homePage = await this._getHomePage();
    await homePage.reload();
  }
}
