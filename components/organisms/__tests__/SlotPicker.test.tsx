import React from 'react';
import { Alert, Platform } from 'react-native';

jest.mock('@expo/vector-icons', () => require('../../__testutils__/vectorIconsMock'));
jest.mock('@react-native-community/datetimepicker', () => require('../../__testutils__/dateTimePickerMock'));

import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { SlotPicker, SlotEditorSheet, slotEndTime, formatDuration, ProposedSlot } from '../SlotPicker';
import * as Barrel from '../SlotPicker/index';

const NOW = new Date(2026, 0, 10, 12, 0, 0);

const icons = (name: string) => screen.UNSAFE_getAllByType(Ionicons).filter((i) => i.props.name === name);
const pickers = () => screen.UNSAFE_queryAllByType(DateTimePicker as any);

describe('helpers SlotPicker', () => {
  it('formatDuration', () => {
    expect(formatDuration(30)).toBe('30 min');
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(90)).toBe('1h30');
    expect(formatDuration(125)).toBe('2h05');
  });

  it('slotEndTime, y compris passage au lendemain', () => {
    expect(slotEndTime({ id: 'a', date: '2026-01-11', startTime: '18:00', durationMinutes: 90 })).toBe('19:30');
    expect(slotEndTime({ id: 'b', date: '2026-01-11', startTime: '23:30', durationMinutes: 60 })).toBe('00:30');
  });

  it('le barrel ré-exporte', () => {
    expect(Barrel.SlotPicker).toBe(SlotPicker);
  });
});

describe('SlotPicker', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    jest.spyOn(Math, 'random').mockReturnValue(0.123456789);
  });
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('sans créneau : carte d’ajout, puis création pré-remplie demain 18h / 1h', () => {
    const onChange = jest.fn();
    render(<SlotPicker slots={[]} onChange={onChange} />);
    expect(screen.getByText('Ajouter un créneau')).toBeOnTheScreen();
    expect(screen.queryByText('Proposer un créneau')).toBeNull();

    fireEvent.press(screen.getByText('Ajouter un créneau'));
    expect(Haptics.selectionAsync).toHaveBeenCalled();
    expect(screen.getByText('Proposer un créneau')).toBeOnTheScreen();
    expect(screen.getByText(/· 18h → 19h/)).toBeOnTheScreen();
    expect(screen.getByText('1h')).toBeOnTheScreen();

    fireEvent.press(screen.getByText('VALIDER CE CRÉNEAU'));
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ date: '2026-01-11', startTime: '18:00', durationMinutes: 60 }),
    ]);
    expect(onChange.mock.calls[0][0][0].id).toMatch(/^2026-01-11\|18:00\|/);
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
    expect(screen.queryByText('Proposer un créneau')).toBeNull();
  });

  const slots: ProposedSlot[] = [
    { id: 's2', date: '2026-01-14', startTime: '19:30', durationMinutes: 90 },
    { id: 's1', date: '2026-01-12', startTime: '18:00', durationMinutes: 60 },
  ];

  it('liste triée par date, avec libellés jour / heures / durée', () => {
    render(<SlotPicker slots={slots} onChange={jest.fn()} />);
    expect(screen.getByText('Ajouter une autre proposition de créneau')).toBeOnTheScreen();
    expect(screen.getByText('18h → 19h · 1h')).toBeOnTheScreen();
    expect(screen.getByText('19h30 → 21h · 1h30')).toBeOnTheScreen();
    const days = screen.getAllByText(/janvier/);
    expect(days[0]).toHaveTextContent(/^Lundi 12 janvier$/);
    expect(days[1]).toHaveTextContent(/^Mercredi 14 janvier$/);
  });

  it('ajout d’un autre créneau : lendemain du dernier, même heure et durée', () => {
    const onChange = jest.fn();
    render(<SlotPicker slots={slots} onChange={onChange} />);
    fireEvent.press(screen.getByText('Ajouter une autre proposition de créneau'));
    expect(screen.getByText('1h30')).toBeOnTheScreen();
    fireEvent.press(screen.getByText('VALIDER CE CRÉNEAU'));
    const next = onChange.mock.calls[0][0];
    expect(next).toHaveLength(3);
    expect(next[2]).toMatchObject({ date: '2026-01-15', startTime: '19:30', durationMinutes: 90 });
  });

  it('modifier un créneau existant', () => {
    const onChange = jest.fn();
    render(<SlotPicker slots={slots} onChange={onChange} />);
    fireEvent.press(screen.getByText('18h → 19h · 1h'));
    expect(screen.getByText('Modifier le créneau')).toBeOnTheScreen();
    fireEvent.press(icons('add').find((i) => i.props.size === 16)!);
    fireEvent.press(screen.getByText('ENREGISTRER'));
    expect(onChange).toHaveBeenCalledWith([
      slots[0],
      { id: 's1', date: '2026-01-12', startTime: '18:00', durationMinutes: 90 },
    ]);
  });

  it('refuse un doublon (même jour et même heure)', () => {
    const onChange = jest.fn();
    render(<SlotPicker slots={slots} onChange={onChange} />);
    fireEvent.press(screen.getByText('Ajouter une autre proposition de créneau'));
    // Ramène la date au 14 (jour du créneau s2) via le picker iOS
    const datePicker = pickers().find((p) => p.props.mode === 'date')!;
    act(() => datePicker.props.onChange({}, new Date(2026, 0, 14)));
    fireEvent.press(screen.getByText('VALIDER CE CRÉNEAU'));
    expect(Alert.alert).toHaveBeenCalledWith('Déjà proposé', 'Un créneau commence déjà à cette heure.');
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('Proposer un créneau')).toBeOnTheScreen();
  });

  it('supprimer un créneau', () => {
    const onChange = jest.fn();
    render(<SlotPicker slots={slots} onChange={onChange} />);
    fireEvent.press(icons('close')[0]);
    expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
    expect(onChange).toHaveBeenCalledWith([slots[0]]);
  });

  it('Annuler ferme la fenêtre', () => {
    render(<SlotPicker slots={[]} onChange={jest.fn()} />);
    fireEvent.press(screen.getByText('Ajouter un créneau'));
    fireEvent.press(screen.getByText('Annuler'));
    expect(screen.queryByText('Proposer un créneau')).toBeNull();
  });
});

describe('SlotEditorSheet', () => {
  const start = new Date(2026, 0, 11, 18, 0);

  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const setup = (props: Partial<React.ComponentProps<typeof SlotEditorSheet>> = {}) => {
    const onSubmit = jest.fn();
    const onCancel = jest.fn();
    const utils = render(
      <SlotEditorSheet
        visible
        title="Titre"
        submitLabel="OK"
        initialStart={start}
        onCancel={onCancel}
        onSubmit={onSubmit}
        {...props}
      />
    );
    return { onSubmit, onCancel, ...utils };
  };

  it('stepper de durée borné entre 30 min et 4h', () => {
    const { onSubmit } = setup({ initialDuration: 60 });
    const minus = () => icons('remove')[0];
    const plus = () => icons('add')[0];
    fireEvent.press(minus());
    expect(screen.getByText('30 min')).toBeOnTheScreen();
    fireEvent.press(minus()); // désactivé à 30 min
    expect(screen.getByText('30 min')).toBeOnTheScreen();
    for (let i = 0; i < 10; i++) fireEvent.press(plus());
    expect(screen.getByText('4h')).toBeOnTheScreen();
    fireEvent.press(screen.getByText('OK'));
    expect(onSubmit).toHaveBeenCalledWith({ date: '2026-01-11', startTime: '18:00', durationMinutes: 240 });
  });

  it('refuse un créneau passé', () => {
    const { onSubmit } = setup({ initialStart: new Date(2026, 0, 10, 11, 0) });
    fireEvent.press(screen.getByText('OK'));
    expect(Alert.alert).toHaveBeenCalledWith('Créneau passé', 'Choisis un jour et une heure à venir.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('indique (lendemain) si la fin dépasse minuit', () => {
    setup({ initialStart: new Date(2026, 0, 11, 23, 30), initialDuration: 60 });
    expect(screen.getByText(/23h30 → 0h30 \(lendemain\)/)).toBeOnTheScreen();
  });

  it('iOS : pickers date et heure mettent à jour le brouillon', () => {
    const { onSubmit } = setup();
    const [datePicker, timePicker] = pickers();
    expect(datePicker.props.mode).toBe('date');
    act(() => datePicker.props.onChange({}, new Date(2026, 1, 3)));
    act(() => pickers()[1].props.onChange({}, new Date(2000, 0, 1, 9, 45)));
    act(() => pickers()[1].props.onChange({}, undefined));
    act(() => pickers()[0].props.onChange({}, undefined));
    expect(timePicker).toBeTruthy();
    fireEvent.press(screen.getByText('OK'));
    expect(onSubmit).toHaveBeenCalledWith({ date: '2026-02-03', startTime: '09:45', durationMinutes: 60 });
  });

  it('Annuler et fond appellent onCancel', () => {
    const { onCancel } = setup();
    fireEvent.press(screen.getByText('Annuler'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('réinitialise le brouillon à chaque ouverture', () => {
    const props = { title: 'T', submitLabel: 'OK', onCancel: jest.fn(), onSubmit: jest.fn() };
    const { rerender } = render(<SlotEditorSheet visible initialStart={start} initialDuration={60} {...props} />);
    fireEvent.press(icons('add')[0]);
    expect(screen.getByText('1h30')).toBeOnTheScreen();
    rerender(<SlotEditorSheet visible={false} initialStart={start} initialDuration={60} {...props} />);
    rerender(<SlotEditorSheet visible initialStart={start} initialDuration={60} {...props} />);
    expect(screen.getByText('1h')).toBeOnTheScreen();
  });

  describe('Android', () => {
    beforeEach(() => {
      jest.replaceProperty(Platform, 'OS', 'android');
    });

    it('ouvre le picker de date puis applique la valeur', () => {
      const { onSubmit } = setup();
      expect(pickers()).toHaveLength(0);
      fireEvent.press(screen.getAllByText('Dimanche 11 janvier')[0]);
      expect(pickers()).toHaveLength(1);
      expect(pickers()[0].props.mode).toBe('date');
      act(() => pickers()[0].props.onChange({}, new Date(2026, 0, 20)));
      expect(pickers()).toHaveLength(0);
      fireEvent.press(screen.getByText('OK'));
      expect(onSubmit).toHaveBeenCalledWith({ date: '2026-01-20', startTime: '18:00', durationMinutes: 60 });
    });

    it('ouvre le picker d’heure, et annulation sans date', () => {
      const { onSubmit } = setup();
      fireEvent.press(screen.getByText('18h'));
      expect(pickers()[0].props.mode).toBe('time');
      expect(pickers()[0].props.minimumDate).toBeUndefined();
      act(() => pickers()[0].props.onChange({}, new Date(2000, 0, 1, 7, 15)));
      fireEvent.press(screen.getByText('7h15'));
      act(() => pickers()[0].props.onChange({ type: 'dismissed' }, undefined));
      expect(pickers()).toHaveLength(0);
      fireEvent.press(screen.getByText('OK'));
      expect(onSubmit).toHaveBeenCalledWith({ date: '2026-01-11', startTime: '07:15', durationMinutes: 60 });
    });
  });
});
