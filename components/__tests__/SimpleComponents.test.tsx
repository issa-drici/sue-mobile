import React from 'react';
import { ActivityIndicator, Animated, RefreshControl, Text, View } from 'react-native';

jest.mock('@expo/vector-icons', () => require('../__testutils__/vectorIconsMock'));

import { Ionicons } from '@expo/vector-icons';
import { render, screen, act } from '@testing-library/react-native';
import OnboardingProgress from '../OnboardingProgress';
import { SmoothTransition } from '../SmoothTransition';
import PullToRefresh from '../PullToRefresh';
import { OptimizedLoading, InlineLoading, SkeletonCard } from '../OptimizedLoading';
import InfoMessage from '../InfoMessage';
import { BrandColors } from '@/constants/Colors';
import { DesignTokens } from '../../constants/DesignSystem';

describe('OnboardingProgress', () => {
  it('affiche un point par étape, actifs jusqu’à l’étape courante', () => {
    const { toJSON } = render(<OnboardingProgress currentStep={2} totalSteps={4} />);
    const dots = (toJSON() as any).children;
    expect(dots).toHaveLength(4);
    const bg = dots.map((d: any) => Object.assign({}, ...d.props.style).backgroundColor);
    expect(bg).toEqual([BrandColors.primary, BrandColors.primary, BrandColors.lightPink, BrandColors.lightPink]);
  });
});

describe('SmoothTransition', () => {
  let parallel: jest.SpyInstance;
  beforeEach(() => {
    parallel = jest.spyOn(Animated, 'parallel').mockReturnValue({ start: jest.fn(), stop: jest.fn(), reset: jest.fn() } as any);
  });
  afterEach(() => jest.restoreAllMocks());

  it('visible : rend les enfants et lance l’animation', () => {
    render(
      <SmoothTransition isVisible duration={100} style={{ margin: 1 }}>
        <Text>Contenu</Text>
      </SmoothTransition>
    );
    expect(screen.getByText('Contenu')).toBeOnTheScreen();
    expect(parallel).toHaveBeenCalledTimes(1);
  });

  it('invisible : ne rend rien, relance l’animation au changement', () => {
    const { rerender, toJSON } = render(
      <SmoothTransition isVisible={false}>
        <Text>Contenu</Text>
      </SmoothTransition>
    );
    expect(toJSON()).toBeNull();
    rerender(
      <SmoothTransition isVisible>
        <Text>Contenu</Text>
      </SmoothTransition>
    );
    expect(parallel).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Contenu')).toBeOnTheScreen();
  });
});

describe('PullToRefresh', () => {
  afterEach(() => jest.restoreAllMocks());

  const get = (u: ReturnType<typeof render>) => u.UNSAFE_getByType(RefreshControl);

  it('couleurs et libellés par défaut', () => {
    const u = render(<PullToRefresh refreshing={false} onRefresh={jest.fn()} />);
    expect(get(u).props).toMatchObject({
      colors: [BrandColors.primary],
      tintColor: BrandColors.primary,
      title: 'Tirez pour rafraîchir',
      progressViewOffset: 0,
    });
  });

  it('libellé pendant le rafraîchissement, couleur personnalisée, props transmises', () => {
    const u = render(<PullToRefresh refreshing onRefresh={jest.fn()} color="#f00" progressViewOffset={10} enabled={false} />);
    expect(get(u).props).toMatchObject({ title: 'Rafraîchissement...', tintColor: '#f00', progressViewOffset: 10, enabled: false });
  });

  it('anti-rebond de 500 ms et ignoré pendant le rafraîchissement', () => {
    const now = jest.spyOn(Date, 'now');
    const onRefresh = jest.fn();
    const u = render(<PullToRefresh refreshing={false} onRefresh={onRefresh} />);
    now.mockReturnValue(10_000);
    act(() => get(u).props.onRefresh());
    expect(onRefresh).toHaveBeenCalledTimes(1);
    now.mockReturnValue(10_200);
    act(() => get(u).props.onRefresh());
    expect(onRefresh).toHaveBeenCalledTimes(1);
    now.mockReturnValue(11_000);
    act(() => get(u).props.onRefresh());
    expect(onRefresh).toHaveBeenCalledTimes(2);
    u.rerender(<PullToRefresh refreshing onRefresh={onRefresh} />);
    now.mockReturnValue(20_000);
    act(() => get(u).props.onRefresh());
    expect(onRefresh).toHaveBeenCalledTimes(2);
  });
});

describe('OptimizedLoading', () => {
  it('message et couleur par défaut', () => {
    const u = render(<OptimizedLoading />);
    expect(screen.getByText('Chargement...')).toBeOnTheScreen();
    expect(u.UNSAFE_getByType(ActivityIndicator).props).toMatchObject({ size: 'small', color: DesignTokens.colors.primary });
  });

  it('options personnalisées et texte masqué', () => {
    const u = render(<OptimizedLoading message="Patience" size="large" color="red" showText={false} style={{ margin: 1 }} />);
    expect(screen.queryByText('Patience')).toBeNull();
    expect(u.UNSAFE_getByType(ActivityIndicator).props).toMatchObject({ size: 'large', color: 'red' });
  });

  it('InlineLoading et SkeletonCard', () => {
    render(<InlineLoading />);
    expect(screen.getByText('Chargement...')).toBeOnTheScreen();
    render(<InlineLoading message="Encore" />);
    expect(screen.getByText('Encore')).toBeOnTheScreen();
    const sk = render(<SkeletonCard />);
    expect(sk.UNSAFE_getAllByType(View)).toHaveLength(4);
  });
});

describe('InfoMessage', () => {
  it.each([
    ['info', 'information-circle', DesignTokens.colors.primary],
    ['warning', 'warning', '#856404'],
    ['success', 'checkmark-circle', '#155724'],
    ['error', 'close-circle', '#721C24'],
    ['inconnu', 'information-circle', DesignTokens.colors.primary],
  ])('type %s', (type, iconName, textColor) => {
    const u = render(<InfoMessage type={type as any} message={`msg-${type}`} />);
    expect(u.UNSAFE_getByType(Ionicons).props.name).toBe(iconName);
    expect(screen.getByText(`msg-${type}`)).toHaveStyle({ color: textColor });
  });

  it('icône personnalisée', () => {
    const u = render(<InfoMessage type="info" message="m" icon="star" style={{ margin: 0 }} />);
    expect(u.UNSAFE_getByType(Ionicons).props.name).toBe('star');
  });
});
