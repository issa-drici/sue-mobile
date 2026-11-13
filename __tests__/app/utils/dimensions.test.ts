/**
 * Dimensions et mise à l'échelle selon la largeur d'écran et la plateforme
 * (testé hors de app/ : expo-router traite chaque fichier de app/ comme une route).
 */
type Dimensions = typeof import('../../../app/utils/dimensions');

function load({ width, os = 'ios', statusBar }: { width: number; os?: string; statusBar?: number }): Dimensions {
  let mod!: Dimensions;
  jest.isolateModules(() => {
    const RN = require('react-native');
    jest.spyOn(RN.Dimensions, 'get').mockReturnValue({ width, height: 800, scale: 2, fontScale: 1 });
    Object.defineProperty(RN.Platform, 'OS', { value: os, configurable: true, writable: true });
    RN.StatusBar.currentHeight = statusBar;
    mod = require('../../../app/utils/dimensions');
  });
  return mod;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('normalize', () => {
  it('écran de référence (375) : tailles inchangées', () => {
    const { normalize } = load({ width: 375 });
    expect(normalize(16)).toBe(16);
    expect(normalize(100)).toBe(100);
  });

  it('grand écran : +10 % max pour les petites tailles, +5 % max pour les autres', () => {
    const { normalize } = load({ width: 430 });
    expect(normalize(20)).toBe(22);
    expect(normalize(24)).toBe(26);
    expect(normalize(100)).toBe(105);
  });

  it('petit écran : réduit proportionnellement', () => {
    const { normalize } = load({ width: 320 });
    expect(normalize(20)).toBe(Math.round(20 * (320 / 375)));
    expect(normalize(100)).toBe(Math.round(100 * (320 / 375)));
  });
});

describe('normalizeMax', () => {
  it('ajoute 20 % sans dépasser la valeur exacte', () => {
    const { normalizeMax } = load({ width: 375 });
    expect(normalizeMax(10)).toBe(12);
    expect(normalizeMax(11)).toBe(13);
    expect(normalizeMax(13)).toBeCloseTo(15.6);
  });
});

describe('constantes', () => {
  it('iOS : hauteurs iOS et dimensions de l’écran', () => {
    const dims = load({ width: 390 });
    expect(dims.screenWidth).toBe(390);
    expect(dims.screenHeight).toBe(800);
    expect(dims.height).toEqual(expect.objectContaining({ tabBar: 49, header: 44, safeAreaTop: 44, safeAreaBottom: 34, statusBar: 0 }));
    expect(dims.default.spacing.md).toBe(16);
    expect(dims.default.fontSize.xxxl).toBe(32);
    expect(dims.default.borderRadius.round).toBe(9999);
    expect(dims.default.width.avatar.xl).toBe(96);
    expect(dims.default.normalize).toBe(dims.normalize);
  });

  it('Android : hauteurs Android, barre d’état prise en compte', () => {
    const dims = load({ width: 390, os: 'android', statusBar: 24 });
    expect(dims.height).toEqual(expect.objectContaining({ tabBar: 60, header: 56, statusBar: 24, safeAreaTop: 24, safeAreaBottom: 0 }));
  });
});
