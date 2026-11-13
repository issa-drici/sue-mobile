/** Mode développeur : dépend de __DEV__ et de l'environnement. */
describe('useDevMode', () => {
  afterEach(() => { jest.resetModules(); });

  const load = (nodeEnv: string) => {
    jest.doMock('../../config/env', () => ({ ENV: { NODE_ENV: nodeEnv } }));
    let hook: typeof import('../useDevMode')['useDevMode'] = () => ({ isDev: false, isProduction: true });
    jest.isolateModules(() => { hook = require('../useDevMode').useDevMode; });
    return hook;
  };

  it('est en mode dev quand __DEV__ et NODE_ENV=development', () => {
    expect(load('development')()).toEqual({ isDev: __DEV__, isProduction: !__DEV__ });
  });

  it('est en production sinon', () => {
    expect(load('production')()).toEqual({ isDev: false, isProduction: true });
  });
});
