import fs from 'fs';
import { Page } from "puppeteer"

/**
 * Exports the content of the page into a PDF
 * @param page The page
 * @param path The name of the PDF (should end with .pdf)
 */
export const pdf = async (page: Page, path: string) => {
  await page.pdf({ path: `logs/${path}`, format: 'A4' });
}

/**
 * Takes a screenshot of the current state of the page
 * @param page The page
 * @param path The name of the screenshot (should end with .png) 
 */
export const screenshot = async (page: Page, path: string) => {
  await page.screenshot({ path: `logs/${path}`, fullPage: true });
}

/**
 * Writes data in a file on the disk
 * @param path The path of the file on the disk
 * @param content The content on the file
 */
export const write = async (path: string, content: string) => new Promise((resolve, reject) => {
  fs.writeFile(`logs/${path}`, content, (err) => {
    if (err) {
      return reject(err);
    }
    resolve();
  });
});

/**
 * Dumps the content of the page into a file
 * @param page The page
 * @param path The name of the file
 */
export const dumpHTML = async (page: Page, path: string) => {
  const html = await page.evaluate(() => document.documentElement.outerHTML);
  await write(path, html);
}

/**
 * Takes a screenshot of the page and dumps its content into a file
 * @param page The page
 * @param path The name of the file
 */
export const debug = async (page: Page, path: string) => Promise.all([
  screenshot(page, `${path}.png`),
  dumpHTML(page, `${path}.html`),
])

/**
 * Generates a random number between the provided bounds
 * @param min The lower bound
 * @param max The upper bound
 */
export const rand = (min: number, max: number) => {
  return min + Math.floor(Math.random() * (max - min));
}