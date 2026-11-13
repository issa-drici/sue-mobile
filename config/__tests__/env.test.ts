/**
 * Configuration d'environnement : valeurs par défaut, variables EXPO_PUBLIC_*, HTTPS forcé en production.
 */
type EnvModule = typeof import('../env');

const ORIGINAL_ENV = { ...process.env };

/** Recharge config/env avec des variables d'environnement données (module relu à chaque appel) */
function loadEnv(vars: Record<string, string | undefined> = {}): EnvModule {
  Object.entries(vars).forEach(([key, value]) => {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  });
  let mod!: EnvModule;
  jest.isolateModules(() => {
    mod = require('../env');
  });
  return mod;
}

const PUBLIC_KEYS = [
  'EXPO_PUBLIC_API_BASE_URL', 'EXPO_PUBLIC_WEB_BASE_URL', 'EXPO_PUBLIC_WEBSOCKET_URL', 'EXPO_PUBLIC_PUSHER_APP_ID',
  'EXPO_PUBLIC_PUSHER_APP_KEY', 'EXPO_PUBLIC_PUSHER_HOST', 'EXPO_PUBLIC_PUSHER_PORT', 'EXPO_PUBLIC_PUSHER_SCHEME',
  'EXPO_PUBLIC_SERVER_HOST', 'EXPO_PUBLIC_SERVER_PORT', 'EXPO_PUBLIC_API_VERSION', 'EXPO_PUBLIC_APP_NAME',
  'EXPO_PUBLIC_APP_VERSION', 'EXPO_PUBLIC_REQUEST_TIMEOUT', 'EXPO_PUBLIC_MAX_RETRIES',
];
const cleared = () => Object.fromEntries(PUBLIC_KEYS.map((k) => [k, undefined]));

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('ENV', () => {
  it('utilise les valeurs par défaut hors production (http, ws local)', () => {
    const { ENV } = loadEnv({ ...cleared(), NODE_ENV: 'development' });
    expect(ENV.API_BASE_URL).toBe('http://api.sue.alliance-tech.fr/api');
    expect(ENV.WEB_BASE_URL).toBe('https://sue-app.fr');
    expect(ENV.WEBSOCKET_URL).toBe('ws://localhost:6001');
    expect(ENV.PUSHER_SCHEME).toBe('http');
    expect(ENV.PUSHER_PORT).toBe('443');
    expect(ENV.SERVER_HOST).toBe('localhost');
    expect(ENV.SERVER_PORT).toBe('8000');
    expect(ENV.API_VERSION).toBe('v1');
    expect(ENV.APP_NAME).toBe('Sue');
    expect(ENV.APP_VERSION).toBe('1.0.0');
    expect(ENV.REQUEST_TIMEOUT).toBe(10000);
    expect(ENV.MAX_RETRIES).toBe(3);
    expect(ENV.IS_DEV).toBe(true);
    expect(ENV.USE_MOCKS).toBe(false);
    expect(ENV.DEFAULT_HEADERS).toEqual({ 'Content-Type': 'application/json', Accept: 'application/json' });
  });

  it('utilise les valeurs de production par défaut (https, wss)', () => {
    const { ENV } = loadEnv({ ...cleared(), NODE_ENV: 'production' });
    expect(ENV.API_BASE_URL).toBe('https://api.sue.alliance-tech.fr/api');
    expect(ENV.WEBSOCKET_URL).toBe('wss://websocket.sue.alliance-tech.fr');
    expect(ENV.PUSHER_SCHEME).toBe('https');
    expect(ENV.IS_DEV).toBe(false);
    expect(ENV.ENVIRONMENT).toBe('production');
  });

  it('lit les variables EXPO_PUBLIC_*', () => {
    const { ENV } = loadEnv({
      EXPO_PUBLIC_API_BASE_URL: 'http://exemple.test/api',
      EXPO_PUBLIC_WEB_BASE_URL: 'https://web.test',
      EXPO_PUBLIC_WEBSOCKET_URL: 'ws://ws.test',
      EXPO_PUBLIC_PUSHER_APP_ID: 'id',
      EXPO_PUBLIC_PUSHER_APP_KEY: 'key',
      EXPO_PUBLIC_PUSHER_HOST: 'host.test',
      EXPO_PUBLIC_PUSHER_PORT: '6001',
      EXPO_PUBLIC_PUSHER_SCHEME: 'https',
      EXPO_PUBLIC_SERVER_HOST: 'srv',
      EXPO_PUBLIC_SERVER_PORT: '9000',
      EXPO_PUBLIC_API_VERSION: 'v2',
      EXPO_PUBLIC_APP_NAME: 'Test',
      EXPO_PUBLIC_APP_VERSION: '9.9.9',
      EXPO_PUBLIC_REQUEST_TIMEOUT: '500',
      EXPO_PUBLIC_MAX_RETRIES: '7',
    });
    expect(ENV.API_BASE_URL).toBe('http://exemple.test/api');
    expect(ENV.WEB_BASE_URL).toBe('https://web.test');
    expect(ENV.WEBSOCKET_URL).toBe('ws://ws.test');
    expect(ENV.PUSHER_APP_ID).toBe('id');
    expect(ENV.PUSHER_APP_KEY).toBe('key');
    expect(ENV.PUSHER_HOST).toBe('host.test');
    expect(ENV.PUSHER_PORT).toBe('6001');
    expect(ENV.PUSHER_SCHEME).toBe('https');
    expect(ENV.SERVER_HOST).toBe('srv');
    expect(ENV.SERVER_PORT).toBe('9000');
    expect(ENV.API_VERSION).toBe('v2');
    expect(ENV.APP_NAME).toBe('Test');
    expect(ENV.APP_VERSION).toBe('9.9.9');
    expect(ENV.REQUEST_TIMEOUT).toBe(500);
    expect(ENV.MAX_RETRIES).toBe(7);
  });

  it('retombe sur « development » quand NODE_ENV est absent', () => {
    const { ENV } = loadEnv({ NODE_ENV: undefined });
    expect(ENV.NODE_ENV).toBe('development');
    expect(ENV.ENVIRONMENT).toBe('development');
    expect(ENV.IS_DEV).toBe(false);
  });
});

describe('getApiConfig', () => {
  it('en développement : configuration telle quelle', () => {
    const { getApiConfig, ENV } = loadEnv({ NODE_ENV: 'development', EXPO_PUBLIC_API_BASE_URL: 'http://dev.test/api' });
    expect(getApiConfig()).toEqual({
      baseURL: 'http://dev.test/api',
      timeout: ENV.REQUEST_TIMEOUT,
      retries: ENV.MAX_RETRIES,
      useMocks: false,
      environment: 'development',
    });
  });

  it('hors développement : HTTPS forcé et jamais de mocks', () => {
    const { getApiConfig } = loadEnv({ NODE_ENV: 'production', EXPO_PUBLIC_API_BASE_URL: 'http://prod.test/api' });
    expect(getApiConfig()).toEqual(expect.objectContaining({
      baseURL: 'https://prod.test/api',
      useMocks: false,
      environment: 'production',
    }));
  });
});

describe('buildApiUrl', () => {
  it('concatène la base et le chemin', () => {
    const { buildApiUrl } = loadEnv({ NODE_ENV: 'test', EXPO_PUBLIC_API_BASE_URL: 'http://api.test/api' });
    expect(buildApiUrl('/sessions')).toBe('http://api.test/api/sessions');
  });

  it('force HTTPS en production', () => {
    const { buildApiUrl } = loadEnv({ NODE_ENV: 'production', EXPO_PUBLIC_API_BASE_URL: 'http://api.test/api' });
    expect(buildApiUrl('/sessions')).toBe('https://api.test/api/sessions');
  });
});

describe('isDevelopment / isMockMode', () => {
  it('vrai en développement', () => {
    const { isDevelopment, isMockMode } = loadEnv({ NODE_ENV: 'development' });
    expect(isDevelopment()).toBe(true);
    expect(isMockMode()).toBe(false); // USE_MOCKS forcé à false
  });

  it('faux en test et en production', () => {
    expect(loadEnv({ NODE_ENV: 'test' }).isDevelopment()).toBe(false);
    expect(loadEnv({ NODE_ENV: 'production' }).isDevelopment()).toBe(false);
  });
});
