import React from 'react';
import { Platform, Text } from 'react-native';

jest.mock('@react-navigation/elements', () => {
  const R = require('react');
  return { PlatformPressable: (p: any) => R.createElement('PlatformPressable', p) };
});
const mockOpenBrowser = jest.fn((..._args: any[]) => Promise.resolve());
jest.mock('expo-web-browser', () => ({ openBrowserAsync: (...a: any[]) => mockOpenBrowser(...a) }));
jest.mock('expo-router', () => {
  const R = require('react');
  return { Link: (p: any) => R.createElement('Link', p) };
});

import * as Haptics from 'expo-haptics';
import { render, act } from '@testing-library/react-native';
import { HapticTab } from '../HapticTab';
import { ExternalLink } from '../ExternalLink';

describe('HapticTab', () => {
  afterEach(() => jest.clearAllMocks());

  it('iOS : retour haptique léger puis onPressIn d’origine', () => {
    const onPressIn = jest.fn();
    const { toJSON } = render(<HapticTab {...({ onPressIn, children: <Text>Tab</Text> } as any)} />);
    (toJSON() as any).props.onPressIn('ev');
    expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
    expect(onPressIn).toHaveBeenCalledWith('ev');
  });

  // Note : babel-preset-expo remplace process.env.EXPO_OS à la compilation (« ios » sous jest-expo),
  // la branche Android n'est donc pas atteignable ici.
  it('onPressIn d’origine optionnel', () => {
    const { toJSON } = render(<HapticTab {...({ children: <Text>Tab</Text> } as any)} />);
    expect(() => (toJSON() as any).props.onPressIn('ev')).not.toThrow();
  });
});

describe('ExternalLink', () => {
  afterEach(() => jest.restoreAllMocks());

  it('natif : empêche le comportement par défaut et ouvre le navigateur intégré', async () => {
    const { toJSON } = render(<ExternalLink href="https://sue-app.fr">Site</ExternalLink>);
    const props = (toJSON() as any).props;
    expect(props).toMatchObject({ target: '_blank', href: 'https://sue-app.fr' });
    const preventDefault = jest.fn();
    await act(async () => props.onPress({ preventDefault }));
    expect(preventDefault).toHaveBeenCalled();
    expect(mockOpenBrowser).toHaveBeenCalledWith('https://sue-app.fr');
  });

  it('web : laisse le lien natif', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    mockOpenBrowser.mockClear();
    const { toJSON } = render(<ExternalLink href="https://x.fr">X</ExternalLink>);
    const preventDefault = jest.fn();
    await act(async () => (toJSON() as any).props.onPress({ preventDefault }));
    expect(preventDefault).not.toHaveBeenCalled();
    expect(mockOpenBrowser).not.toHaveBeenCalled();
  });
});
