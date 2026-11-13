/**
 * Écrans de développement : visibles seulement en __DEV__ ET avec NODE_ENV=development.
 */
type DevScreensModule = typeof import('../devScreens');

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
const ORIGINAL_DEV = (global as any).__DEV__;

function load(nodeEnv: string, dev: boolean): DevScreensModule {
  (process.env as Record<string, string>).NODE_ENV = nodeEnv;
  (global as any).__DEV__ = dev;
  let mod!: DevScreensModule;
  jest.isolateModules(() => {
    mod = require('../devScreens');
  });
  return mod;
}

afterEach(() => {
  (process.env as Record<string, string | undefined>).NODE_ENV = ORIGINAL_NODE_ENV;
  (global as any).__DEV__ = ORIGINAL_DEV;
});

it('expose les noms des écrans de développement', () => {
  const { DEV_SCREENS } = load('development', true);
  expect(DEV_SCREENS).toEqual({ ATOMS_DEMO: 'atoms-demo', STORYBOOK: 'storybook', DEBUG_CONFIG: 'debug-config' });
});

it('autorise les écrans connus en développement', () => {
  const { isDevScreenAllowed, getDevScreens } = load('development', true);
  expect(isDevScreenAllowed('atoms-demo')).toBe(true);
  expect(isDevScreenAllowed('debug-config')).toBe(true);
  expect(isDevScreenAllowed('inconnu')).toBe(false);
  expect(getDevScreens()).toEqual([
    expect.objectContaining({ name: 'atoms-demo', route: '/atoms-demo', title: 'Atoms Demo' }),
  ]);
});

it('refuse tout hors développement (NODE_ENV)', () => {
  const { isDevScreenAllowed, getDevScreens } = load('production', true);
  expect(isDevScreenAllowed('atoms-demo')).toBe(false);
  expect(getDevScreens()).toEqual([]);
});

it('refuse tout quand __DEV__ est faux', () => {
  const { isDevScreenAllowed, getDevScreens } = load('development', false);
  expect(isDevScreenAllowed('atoms-demo')).toBe(false);
  expect(getDevScreens()).toEqual([]);
});
