"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function short(selector, isIdSelector) {
    // translate custom CSS selector extension: {...} shortcut will be translated to:
    // type-selector: [data-test=...]
    // or id-selector: [data-test-id=...]
    const testAttr = isIdSelector ? 'data-test-id' : 'data-test';
    const SHORTCUT_SYNTAX = /\{([^}]+)\}/gi;
    return selector.replace(SHORTCUT_SYNTAX, `[${testAttr}='$1']`);
}
exports.short = short;
