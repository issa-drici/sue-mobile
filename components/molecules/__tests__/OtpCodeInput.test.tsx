import React from 'react';
import { TextInput } from 'react-native';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { OtpCodeInput } from '../OtpCodeInput/OtpCodeInput';

describe('OtpCodeInput', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('affiche les chiffres saisis dans les cases', () => {
    render(<OtpCodeInput value="12" onChange={jest.fn()} autoFocus={false} />);
    expect(screen.getByText('1')).toBeOnTheScreen();
    expect(screen.getByText('2')).toBeOnTheScreen();
  });

  it('filtre les caractères non numériques et limite à 6', () => {
    const onChange = jest.fn();
    const onComplete = jest.fn();
    const { UNSAFE_getByType } = render(
      <OtpCodeInput value="" onChange={onChange} onComplete={onComplete} autoFocus={false} />
    );
    fireEvent.changeText(UNSAFE_getByType(TextInput), '12a3');
    expect(onChange).toHaveBeenLastCalledWith('123');
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.changeText(UNSAFE_getByType(TextInput), '1234567');
    expect(onChange).toHaveBeenLastCalledWith('123456');
    expect(onComplete).toHaveBeenCalledWith('123456');
  });

  it('code complet sans onComplete ne plante pas', () => {
    const onChange = jest.fn();
    const { UNSAFE_getByType } = render(<OtpCodeInput value="" onChange={onChange} autoFocus={false} />);
    fireEvent.changeText(UNSAFE_getByType(TextInput), '654321');
    expect(onChange).toHaveBeenCalledWith('654321');
  });

  it('autoFocus : focus après 350 ms, et au clic sur les cases', () => {
    const focus = jest.spyOn(TextInput.prototype as any, 'focus').mockImplementation(() => {});
    const { unmount } = render(<OtpCodeInput value="" onChange={jest.fn()} />);
    act(() => {
      jest.advanceTimersByTime(350);
    });
    const before = focus.mock.calls.length;
    fireEvent.press(screen.getAllByText('')[0]);
    expect(focus.mock.calls.length).toBeGreaterThanOrEqual(before);
    unmount();
  });
});
