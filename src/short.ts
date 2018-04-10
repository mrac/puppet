export function short(selector: string, isIdSelector?: boolean) {
    // translate custom CSS selector extension: {...} shortcut will be translated to:
    // type-selector: [data-test=...]
    // or id-selector: [data-test-id=...]
    const testAttr = isIdSelector ? 'data-test-id' : 'data-test';
    const SHORTCUT_SYNTAX = /\{([^}]+)\}/gi;
    return selector.replace(SHORTCUT_SYNTAX, `[${testAttr}='$1']`);
  }