import React from 'react';
import { RefreshControl, Text } from 'react-native';

jest.mock('@expo/vector-icons', () => require('../../__testutils__/vectorIconsMock'));
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SectionList } from '../SectionList';

const renderItem = (item: string, i: number) => <Text>{`${i}:${item}`}</Text>;

describe('SectionList', () => {
  it('affiche uniquement les sections non vides', () => {
    render(
      <SectionList
        sections={[
          { title: 'A', data: ['x', 'y'], renderItem },
          { title: 'Vide', data: [], renderItem },
        ]}
      />
    );
    expect(screen.getByText('A')).toBeOnTheScreen();
    expect(screen.getByText('0:x')).toBeOnTheScreen();
    expect(screen.getByText('1:y')).toBeOnTheScreen();
    expect(screen.queryByText('Vide')).toBeNull();
  });

  it('état vide si aucune donnée et emptyState fourni', () => {
    const onAction = jest.fn();
    render(
      <SectionList
        sections={[{ title: 'A', data: [], renderItem }]}
        emptyState={{ title: 'Rien', subtitle: 'Sub', actionTitle: 'Go', onAction }}
      />
    );
    expect(screen.getByText('Rien')).toBeOnTheScreen();
    fireEvent.press(screen.getByText('Go'));
    expect(onAction).toHaveBeenCalled();
  });

  it('sans emptyState : liste vide sans planter', () => {
    const { UNSAFE_queryByType } = render(<SectionList sections={[]} />);
    expect(UNSAFE_queryByType(RefreshControl)).toBeNull();
  });

  it('RefreshControl quand onRefresh est fourni', () => {
    const onRefresh = jest.fn();
    const { UNSAFE_getByType } = render(
      <SectionList sections={[{ title: 'A', data: ['x'], renderItem }]} onRefresh={onRefresh} refreshing />
    );
    const rc = UNSAFE_getByType(RefreshControl);
    expect(rc.props.refreshing).toBe(true);
    rc.props.onRefresh();
    expect(onRefresh).toHaveBeenCalled();
  });
});
