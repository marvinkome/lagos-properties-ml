import { writeFileSync } from "fs";
import webdriver from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome";
import chromeDriver from "chromedriver";

type PropertyType = {
  type: string;
  shortDesc: string;
  link: string;
  rent: string;
  addedOn: string;
  location: string;
  marketedBy: string;
  metaProps: {
    [x: string]: string;
  };
};

class Crawler {
  properties: PropertyType[] = [];
  driver?: webdriver.WebDriver = undefined;

  constructor() {
    // @ts-ignore
    return (async () => {
      await this.setup();
      return this;
    })();
  }

  async setup() {
    const service = new chrome.ServiceBuilder(chromeDriver.path).build();
    chrome.setDefaultService(service);

    const option = new chrome.Options()
      .setUserPreferences({
        "profile.default_content_setting_values.notifications": 2,
      })
      .headless();

    this.driver = await new webdriver.Builder()
      .withCapabilities(webdriver.Capabilities.chrome())
      .setChromeOptions(option)
      .build();

    // setup browser
    try {
      await this.driver.get("https://nigeriapropertycentre.com/");
    } catch (e) {
      console.error("CRAWLER ERROR:: Error with the crawler:", e.message);
      this.driver.quit();
    }
  }

  async getPropertiesInCity(city: string) {
    let page = 1;

    await this.searchForProperties(city);

    // wait for results to be loaded
    await this.driver?.wait(
      webdriver.until.elementLocated({ className: "property-list" })
    );

    // get the initial number of properties
    const numberOfProperties = await this.driver?.findElement({
      className: "pagination-results",
    });
    console.log(await numberOfProperties?.getText());

    // get initial data
    const prop = await this.getPropertiesInAPage();
    this.properties = this.properties.concat(prop);
    console.log(`Got ${prop.length} properties from page ${page}`);

    // get the next btn
    let nextBtn = await this.driver?.findElement({
      css: "[aria-label='Next »']",
    });

    // check if button is disabled
    let nextBtnDisabled =
      (await nextBtn?.getAttribute("aria-disabled")) === "true";

    // go to next page
    await nextBtn?.click();
    page++;

    const paginationEl = this.driver?.findElement({
      css: "[aria-current='page'] .activePage",
    })!;
    await this.driver?.wait(
      webdriver.until.elementTextContains(paginationEl, `${page}`)
    );

    while (!nextBtnDisabled) {
      // get data
      const prop = await this.getPropertiesInAPage();
      this.properties = this.properties.concat(prop);
      console.log(`Got ${prop.length} properties from page ${page}`);

      // load new next button
      nextBtn = await this.driver?.findElement({
        css: "[aria-label='Next »']",
      });

      nextBtnDisabled =
        (await nextBtn?.getAttribute("aria-disabled")) === "true";

      if (nextBtnDisabled) {
        break;
      }

      // go to next page
      await nextBtn?.click();
      page++;

      const paginationEl = this.driver?.findElement({
        css: "[aria-current='page'] .activePage",
      })!;
      await this.driver?.wait(
        webdriver.until.elementTextContains(paginationEl, `${page}`)
      );
    }

    return this.properties;
  }

  private async searchForProperties(city: string) {
    const searchForm = this.driver?.findElement({ className: "search_jsForm" });

    const rentTab = await searchForm?.findElement({ id: "li-cid-for-rent" });
    await rentTab?.click();

    const input = await searchForm?.findElement({ name: "propertyLocation" });
    await input?.clear();
    await input?.sendKeys(`${city}, Lagos`);

    await this.driver?.executeScript(`
    const ul = document.querySelector("#eac-container-propertyLocation ul");
    ul.style.display = "block";
    `);

    await this.driver?.wait(
      webdriver.until.elementLocated({ className: "eac-item" })
    );

    const autoSuggest = await searchForm?.findElement({
      className: "eac-item",
    });
    await autoSuggest?.click();

    const propertyType = await searchForm?.findElement({ name: "tid" });
    await propertyType?.sendKeys(`Flat`, webdriver.Key.ENTER);
  }

  private async getPropertiesInAPage() {
    let count = 0;
    const properties: PropertyType[] = [];

    const propertiesDoc = await this.driver?.findElements({
      className: "property-list",
    });

    if (!propertiesDoc) throw new Error("No properties found");

    for (let propertyDoc of propertiesDoc) {
      const shortDesc = await (
        await propertyDoc.findElement({ css: '[itemprop="name"]' })
      ).getText();

      const type = await (
        await propertyDoc.findElement({ className: "content-title" })
      ).getText();

      const link = await (
        await propertyDoc.findElement({ css: '[itemprop="url"]' })
      ).getAttribute("href");

      const rent = await (
        await propertyDoc.findElements({ className: "price" })
      )[1].getText();

      const addedOn = await (
        await propertyDoc.findElement({ css: "span.added-on" })
      ).getText();

      const location = await (
        await propertyDoc.findElement({ css: "address" })
      ).getText();

      const marketedBy = await (
        await propertyDoc.findElement({ className: "marketed-by" })
      ).getAttribute("textContent");

      const meta = await propertyDoc.findElements({
        css: ".aux-info li:not(.save-favourite-button)",
      });

      const metaProps: any = {};
      for (const el of meta) {
        const spans = await el.findElements({ tagName: "span" });

        if (!spans.length) continue;

        const value = await spans[0]?.getText();
        const key = await spans[1]?.getText();

        metaProps[key] = value;
      }

      properties.push({
        type,
        shortDesc,
        link,
        rent,
        addedOn,
        location,
        marketedBy,
        metaProps,
      });

      count++;
      console.log("Got all for property ", count);
    }

    return properties;
  }
}

async function init() {
  const crawler = await new Crawler();

  try {
    const props = await crawler.getPropertiesInCity("Gbagada");
    writeFileSync("gbagada-properties.json", JSON.stringify(props));
    console.log(props.length);
  } catch (e) {
    console.error("ERR:: Error with crawler:", e);
  } finally {
    await crawler.driver?.quit();
  }
}

init();
