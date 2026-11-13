import { render, screen } from '@testing-library/react-native';
import React from 'react';

import AuthLayout from '../../../app/(auth)/_layout';

jest.mock('expo-router', () => require('../../../test-utils/screens').expoRouterMock());

describe('AuthLayout', () => {
  it('déclare les écrans login et register, sans en-tête et fond blanc', () => {
    render(<AuthLayout />);
    expect(screen.getByText('screen:login')).toBeTruthy();
    expect(screen.getByText('screen:register')).toBeTruthy();
    expect(screen.getByTestId('stack-navigator').props.screenOptions).toEqual({
      headerShown: false,
      contentStyle: { backgroundColor: '#fff' },
    });
  });
});
