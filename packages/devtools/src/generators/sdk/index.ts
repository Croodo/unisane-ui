/**
 * SDK generation module
 */

// Types
export type {
  AppRouteEntry,
  RouteGroup,
  AliasEntry,
  ImportMapEntry,
  SdkTarget,
  SdkGenOptions,
} from './types.js';

// Utilities
export {
  pascalCase,
  camelCase,
  extractParamNames,
  isAdminRoute,
  parseOpKey,
  header,
} from './utils.js';

// Router parsing
export { parseRouterImports, collectRouteGroups } from './router-parser.js';

// Generators
export { genTypes } from './gen-types.js';
export { genBrowser } from './gen-browser.js';
export { genServer } from './gen-server.js';
export { genHooks } from './gen-hooks.js';
export { genVue } from './gen-vue.js';
export { genZod } from './gen-zod.js';
