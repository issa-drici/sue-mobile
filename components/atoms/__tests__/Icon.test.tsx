import React from 'react';

jest.mock('@expo/vector-icons', () => require('../../__testutils__/vectorIconsMock'));
import { render, fireEvent } from '@testing-library/react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Icons from '../Icon';
import { DesignTokens } from '../../../constants/DesignSystem';

const { Icon } = Icons;

const getIcon = (utils: ReturnType<typeof render>) => utils.UNSAFE_getByType(Ionicons);

describe('Icon', () => {
  it('valeurs par défaut : taille md, couleur texte', () => {
    const u = render(<Icon name="add" />);
    expect(getIcon(u).props.size).toBe(DesignTokens.iconSizes.md);
    expect(getIcon(u).props.color).toBe(DesignTokens.colors.text);
  });

  it.each(['xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const)('taille %s', (size) => {
    const u = render(<Icon name="add" size={size} />);
    expect(getIcon(u).props.size).toBe(DesignTokens.iconSizes[size]);
  });

  it('taille numérique et inconnue', () => {
    expect(getIcon(render(<Icon name="add" size={42} />)).props.size).toBe(42);
    expect(getIcon(render(<Icon name="add" size={'zz' as any} />)).props.size).toBe(DesignTokens.iconSizes.md);
  });

  it.each([
    ['primary', DesignTokens.colors.text],
    ['secondary', DesignTokens.colors.textSecondary],
    ['tertiary', DesignTokens.colors.textTertiary],
    ['inverse', DesignTokens.colors.textInverse],
    ['error', DesignTokens.colors.error],
    ['success', DesignTokens.colors.success],
    ['warning', DesignTokens.colors.warning],
    ['info', DesignTokens.colors.info],
    ['#123456', '#123456'],
    ['rgb(1,2,3)', 'rgb(1,2,3)'],
    ['red', 'red'],
  ])('couleur %s', (color, expected) => {
    expect(getIcon(render(<Icon name="add" color={color} />)).props.color).toBe(expected);
  });

  it('couleur non chaîne : retombe sur la couleur texte', () => {
    expect(getIcon(render(<Icon name="add" color={123 as any} />)).props.color).toBe(DesignTokens.colors.text);
  });

  it('cliquable quand onPress est fourni', () => {
    const onPress = jest.fn();
    const u = render(<Icon name="add" onPress={onPress} />);
    fireEvent.press(getIcon(u));
    expect(onPress).toHaveBeenCalled();
  });

  it.each([
    ['SmallIcon', { size: DesignTokens.iconSizes.sm }],
    ['LargeIcon', { size: DesignTokens.iconSizes.lg }],
    ['ErrorIcon', { color: DesignTokens.colors.error }],
    ['SuccessIcon', { color: DesignTokens.colors.success }],
    ['WarningIcon', { color: DesignTokens.colors.warning }],
  ])('%s', (name, expected) => {
    const C = (Icons as any)[name];
    expect(getIcon(render(<C name="add" />)).props).toMatchObject(expected);
  });

  it.each([
    ['BackIcon', 'chevron-back'],
    ['CloseIcon', 'close'],
    ['SearchIcon', 'search'],
    ['AddIcon', 'add'],
    ['HeartIcon', 'heart'],
    ['StarIcon', 'star'],
    ['EditIcon', 'pencil'],
    ['DeleteIcon', 'trash'],
    ['CheckIcon', 'checkmark'],
    ['LocationIcon', 'location'],
    ['CalendarIcon', 'calendar'],
    ['TimeIcon', 'time'],
    ['PeopleIcon', 'people'],
    ['PersonIcon', 'person'],
    ['NotificationIcon', 'notifications'],
    ['SettingsIcon', 'settings'],
    ['MenuIcon', 'menu'],
    ['MoreIcon', 'ellipsis-horizontal'],
  ])('%s utilise l’icône %s', (name, glyph) => {
    const C = (Icons as any)[name];
    expect(getIcon(render(<C />)).props.name).toBe(glyph);
  });
});
