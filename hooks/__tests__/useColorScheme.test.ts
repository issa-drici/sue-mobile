/** Thème clair / sombre : natif, web (hydratation) et couleurs. */
import { renderHook } from '@testing-library/react-native';
import * as RN from 'react-native';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../useColorScheme';
import { useColorScheme as useWebColorScheme } from '../useColorScheme.web';
import { useThemeColor } from '../useThemeColor';

afterEach(() => { jest.restoreAllMocks(); });

it('le hook natif réexporte celui de React Native', () => {
  expect(useColorScheme).toBe(RN.useColorScheme);
});

it('le hook web renvoie le thème du système une fois hydraté', () => {
  jest.spyOn(RN, 'useColorScheme').mockReturnValue('dark');
  const { result } = renderHook(() => useWebColorScheme());
  expect(result.current).toBe('dark');
});

it('le hook web renvoie « light » avant hydratation', () => {
  jest.spyOn(RN, 'useColorScheme').mockReturnValue('dark');
  // Rendu statique (sans effets) : on capte la première valeur rendue
  const values: (string | null | undefined)[] = [];
  renderHook(() => { const v = useWebColorScheme(); values.push(v); return v; });
  expect(values[0]).toBe('light');
  expect(values[values.length - 1]).toBe('dark');
});

describe('useThemeColor', () => {
  it('préfère la couleur passée en props pour le thème courant', () => {
    jest.spyOn(RN, 'useColorScheme').mockReturnValue('dark');
    const { result } = renderHook(() => useThemeColor({ light: '#111', dark: '#222' }, 'text'));
    expect(result.current).toBe('#222');
  });

  it('retombe sur la palette sinon', () => {
    jest.spyOn(RN, 'useColorScheme').mockReturnValue('light');
    const { result } = renderHook(() => useThemeColor({}, 'tint'));
    expect(result.current).toBe(Colors.light.tint);
  });

  it('utilise le thème clair si le système ne dit rien', () => {
    jest.spyOn(RN, 'useColorScheme').mockReturnValue(null);
    const { result } = renderHook(() => useThemeColor({ light: '#abc' }, 'text'));
    expect(result.current).toBe('#abc');
  });
});
