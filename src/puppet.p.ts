import { Browser, Page, ElementHandle, LaunchOptions, launch } from 'puppeteer';
import { short as s } from './short';

const envDebug = process.env.DEBUG;

export interface PuppetConfig {
  parent?: Puppet;
  context?: Puppet;
  browser?: Browser;
  page?: Page;
  idSelector?: string;
  ascendantSelector?: string;
}

export interface PuppetLaunchOptions extends LaunchOptions {
  debug?: boolean;
  width?: number;
  height?: number;
}

export abstract class Puppet {
  parent?: Puppet;
  browser: Browser;
  page: Page;
  protected idSelector?: string;
  protected ascendantSelector?: string;
  protected abstract typeSelector: string;

  constructor(config: PuppetConfig) {
    const context = config.context || ({} as Puppet);
    this.parent = config.parent;
    this.browser = context.browser || (config.browser as Browser) || (this.parent && this.parent.browser);
    this.page = context.page || (config.page as Page) || (this.parent && this.parent.page);
    this.idSelector = config.idSelector;
    this.ascendantSelector = config.ascendantSelector;
  }

  static async start<T extends Puppet>(puppetConfig: PuppetConfig = {}, launchOptions?: PuppetLaunchOptions): Promise<T> {
    const PuppetConstructor = (this as any) as { new (config: PuppetConfig): T };
    const { browser, page } = await Puppet.launch(launchOptions);
    Object.assign(puppetConfig, { browser, page });
    return new PuppetConstructor(puppetConfig) as T;
  }

  static async launch(options: PuppetLaunchOptions = {}): Promise<{ browser: Browser; page: Page }> {
    let browser: Browser;
    let page: Page;

    // strip custom option parameters
    const nativeOptions = Object.assign({}, options);
    delete nativeOptions.debug;
    delete nativeOptions.width;
    delete nativeOptions.height;

    const defaultOptions: PuppetLaunchOptions = {
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    };

    if (envDebug || options.debug) {
      defaultOptions.headless = false;
      defaultOptions.slowMo = 10;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
    }

    const width = options.width || 1024;
    const height = options.height || 768;
    defaultOptions.args = (defaultOptions.args || []).concat([`--window-size=${width},${height}`]);

    // by default ignore all HTTPS errors (necessary for https://localhost)
    defaultOptions.ignoreHTTPSErrors = true;

    // overwrite default options
    Object.assign(defaultOptions, nativeOptions);

    // launch puppeteer
    browser = await launch(defaultOptions);
    page = await browser.newPage();

    if (envDebug || options.debug) {
      page.on('console', l => {
        // tslint:disable-next-line:no-console
        console.log('\x1b[36m%s\x1b[0m', l.text());
      });
    }

    await page.setViewport({ width, height });
    return { browser, page };
  }

  static short(selector: string, isIdSelector?: boolean) {
    return s(selector, isIdSelector);
  }

  selector(descendantSelector?: string): string {
    const parent = this.parent ? this.parent.selector() + ' ' : '';
    const ascendant = this.ascendantSelector ? Puppet.short(this.ascendantSelector) + ' ' : '';
    const type = Puppet.short(this.typeSelector || '');
    const id = this.idSelector ? Puppet.short(this.idSelector, true) + ' ' : '';
    const descendant = Puppet.short(descendantSelector ? ' ' + descendantSelector : '');
    const MULTIPLE_SPACES = /[ ]+/gi;

    if (!this.typeSelector) {
      throw new Error(`Puppet: typeSelector not specified for ${this.constructor.name}`);
    }

    if (id && id.trim().match(/ /)) {
      throw new Error(
        `Puppet: spaces are not allowed in idSelector: '${this.idSelector}' for ${this.constructor.name}`
      );
    }

    return (parent + ascendant + type + id + descendant).replace(MULTIPLE_SPACES, ' ').trim();
  }

  async elem(): Promise<ElementHandle> {
    return (await this.page.$(this.selector())) as ElementHandle;
  }

  async waitFor(): Promise<void> {
    await this.page.waitForSelector(this.selector());
  }
}
