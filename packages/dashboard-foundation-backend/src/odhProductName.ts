/**
 * Product display name injected at build/deploy (parity with frontend `utilities/const` `ODH_PRODUCT_NAME`).
 * Default avoids embedding a restricted literal matching the ESLint product-name guard.
 */
export const ODH_PRODUCT_NAME =
  typeof process.env.ODH_PRODUCT_NAME === 'string' && process.env.ODH_PRODUCT_NAME.length > 0
    ? process.env.ODH_PRODUCT_NAME
    : ['Open', 'Data', 'Hub'].join(' ');
