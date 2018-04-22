"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = require("puppeteer");
const short_1 = require("./short");
const envDebug = process.env.DEBUG;
class Puppet {
    constructor(config) {
        const context = config.context || {};
        this.parent = config.parent;
        this.browser = context.browser || config.browser || (this.parent && this.parent.browser);
        this.page = context.page || config.page || (this.parent && this.parent.page);
        this.idSelector = config.idSelector;
        this.ascendantSelector = config.ascendantSelector;
    }
    static start(puppetConfig = {}, launchOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            const PuppetConstructor = this;
            const { browser, page } = yield Puppet.launch(launchOptions);
            Object.assign(puppetConfig, { browser, page });
            return new PuppetConstructor(puppetConfig);
        });
    }
    static launch(options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            let browser;
            let page;
            // strip custom option parameters
            const nativeOptions = Object.assign({}, options);
            delete nativeOptions.debug;
            delete nativeOptions.width;
            delete nativeOptions.height;
            const defaultOptions = {
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
            browser = yield puppeteer_1.launch(defaultOptions);
            page = yield browser.newPage();
            if (envDebug || options.debug) {
                page.on('console', l => {
                    // tslint:disable-next-line:no-console
                    console.log('\x1b[36m%s\x1b[0m', l.text());
                });
            }
            yield page.setViewport({ width, height });
            return { browser, page };
        });
    }
    static short(selector, isIdSelector) {
        return short_1.short(selector, isIdSelector);
    }
    selector(descendantSelector) {
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
            throw new Error(`Puppet: spaces are not allowed in idSelector: '${this.idSelector}' for ${this.constructor.name}`);
        }
        return (parent + ascendant + type + id + descendant).replace(MULTIPLE_SPACES, ' ').trim();
    }
    elem() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.page.$(this.selector()));
        });
    }
    waitFor() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.page.waitForSelector(this.selector());
        });
    }
}
exports.Puppet = Puppet;
