import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Alert, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BrandColors } from '../../../constants/Colors';

const DURATION_STEP = 30;
const MIN_DURATION = 30;
const MAX_DURATION = 240;
const DEFAULT_DURATION = 60;
const DEFAULT_START_HOUR = 18;

/** Créneau proposé par l'organisateur (heure locale). */
export interface ProposedSlot {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  durationMinutes: number;
}

const pad = (n: number) => String(n).padStart(2, '0');
const toDateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toTimeKey = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const slotStart = (slot: Pick<ProposedSlot, 'date' | 'startTime'>) => {
  const [y, mo, d] = slot.date.split('-').map(Number);
  const [h, mi] = slot.startTime.split(':').map(Number);
  return new Date(y, mo - 1, d, h, mi);
};

export const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h}h` : `${h}h${pad(m)}`;
};

const formatHour = (d: Date) => (d.getMinutes() === 0 ? `${d.getHours()}h` : `${d.getHours()}h${pad(d.getMinutes())}`);

const formatDayLabel = (d: Date) => {
  const label = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

export interface SlotPickerProps {
  slots: ProposedSlot[];
  onChange: (slots: ProposedSlot[]) => void;
}

export function SlotPicker({ slots, onChange }: SlotPickerProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftStart, setDraftStart] = useState(new Date());
  const [draftDuration, setDraftDuration] = useState(DEFAULT_DURATION);
  const [androidPicker, setAndroidPicker] = useState<'date' | 'time' | null>(null);

  const sortedSlots = [...slots].sort((a, b) => slotStart(a).getTime() - slotStart(b).getTime());

  const openNewSlot = () => {
    Haptics.selectionAsync();
    // Pré-rempli avec le lendemain du dernier créneau, même heure et même durée :
    // proposer plusieurs soirs d'affilée se fait en validant directement.
    const last = sortedSlots[sortedSlots.length - 1];
    const start = last ? slotStart(last) : new Date();
    start.setDate(start.getDate() + 1);
    if (!last) start.setHours(DEFAULT_START_HOUR, 0, 0, 0);
    setEditingId(null);
    setDraftStart(start);
    setDraftDuration(last ? last.durationMinutes : DEFAULT_DURATION);
    setIsEditorOpen(true);
  };

  const openExistingSlot = (slot: ProposedSlot) => {
    Haptics.selectionAsync();
    setEditingId(slot.id);
    setDraftStart(slotStart(slot));
    setDraftDuration(slot.durationMinutes);
    setIsEditorOpen(true);
  };

  const removeSlot = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(slots.filter((s) => s.id !== id));
  };

  const validateDraft = () => {
    if (draftStart.getTime() <= Date.now()) {
      Alert.alert('Créneau passé', 'Choisis un jour et une heure à venir.');
      return;
    }
    const date = toDateKey(draftStart);
    const startTime = toTimeKey(draftStart);
    const isDuplicate = slots.some((s) => s.id !== editingId && s.date === date && s.startTime === startTime);
    if (isDuplicate) {
      Alert.alert('Déjà proposé', 'Tu as déjà proposé ce créneau.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const slot: ProposedSlot = {
      id: editingId ?? `${date}|${startTime}|${Math.random().toString(36).slice(2, 8)}`,
      date,
      startTime,
      durationMinutes: draftDuration,
    };
    onChange(editingId ? slots.map((s) => (s.id === editingId ? slot : s)) : [...slots, slot]);
    setIsEditorOpen(false);
  };

  const changeDuration = (delta: number) => {
    const next = draftDuration + delta;
    if (next < MIN_DURATION || next > MAX_DURATION) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDraftDuration(next);
  };

  const updateDraftDate = (picked: Date) => {
    const next = new Date(draftStart);
    next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
    setDraftStart(next);
  };

  const updateDraftTime = (picked: Date) => {
    const next = new Date(draftStart);
    next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
    setDraftStart(next);
  };

  const draftEnd = new Date(draftStart.getTime() + draftDuration * 60_000);

  return (
    <View style={styles.container}>
      <Text style={styles.intro}>
        Propose un ou plusieurs créneaux où tu peux jouer. Tes joueurs indiqueront ceux qui leur conviennent.
      </Text>

      {sortedSlots.length === 0 ? (
        <TouchableOpacity activeOpacity={0.8} style={styles.emptyAddCard} onPress={openNewSlot}>
          <View style={styles.emptyAddIcon}>
            <Ionicons name="add" size={24} color={BrandColors.success} />
          </View>
          <Text style={styles.emptyAddTitle}>Ajouter un créneau</Text>
          <Text style={styles.emptyAddSubtitle}>Choisis un jour, une heure et une durée</Text>
        </TouchableOpacity>
      ) : (
        <>
          <TouchableOpacity activeOpacity={0.8} style={styles.addAnotherButton} onPress={openNewSlot}>
            <Ionicons name="add" size={18} color={BrandColors.success} />
            <Text style={styles.addAnotherText}>Ajouter une autre proposition de créneau</Text>
          </TouchableOpacity>

          {sortedSlots.map((slot) => {
            const start = slotStart(slot);
            const end = new Date(start.getTime() + slot.durationMinutes * 60_000);
            return (
              <TouchableOpacity
                key={slot.id}
                activeOpacity={0.8}
                style={styles.slotCard}
                onPress={() => openExistingSlot(slot)}
              >
                <View style={styles.slotIcon}>
                  <Ionicons name="calendar-outline" size={18} color={BrandColors.success} />
                </View>
                <View style={styles.slotTexts}>
                  <Text style={styles.slotDay}>{formatDayLabel(start)}</Text>
                  <Text style={styles.slotTime}>
                    {formatHour(start)} → {formatHour(end)} · {formatDuration(slot.durationMinutes)}
                  </Text>
                </View>
                <TouchableOpacity
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  onPress={() => removeSlot(slot.id)}
                  style={styles.removeButton}
                >
                  <Ionicons name="close" size={18} color="#8E8E93" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </>
      )}

      <Modal
        visible={isEditorOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditorOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setIsEditorOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => setIsEditorOpen(false)}>
                <Text style={styles.sheetCancel}>Annuler</Text>
              </TouchableOpacity>
              <Text style={styles.sheetTitle}>{editingId ? 'Modifier le créneau' : 'Proposer un créneau'}</Text>
              <View style={styles.sheetHeaderSpacer} />
            </View>

            <View style={styles.sheetRow}>
              <Ionicons name="calendar-outline" size={18} color="#8E8E93" />
              <Text style={styles.sheetRowLabel}>Jour</Text>
              {Platform.OS === 'ios' ? (
                <DateTimePicker
                  value={draftStart}
                  mode="date"
                  display="compact"
                  minimumDate={new Date()}
                  locale="fr-FR"
                  themeVariant="light"
                  onChange={(_, d) => d && updateDraftDate(d)}
                />
              ) : (
                <TouchableOpacity onPress={() => setAndroidPicker('date')}>
                  <Text style={styles.sheetRowValue}>{formatDayLabel(draftStart)}</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.sheetRow}>
              <Ionicons name="time-outline" size={18} color="#8E8E93" />
              <Text style={styles.sheetRowLabel}>Heure de début</Text>
              {Platform.OS === 'ios' ? (
                <DateTimePicker
                  value={draftStart}
                  mode="time"
                  display="compact"
                  minuteInterval={15}
                  locale="fr-FR"
                  themeVariant="light"
                  onChange={(_, d) => d && updateDraftTime(d)}
                />
              ) : (
                <TouchableOpacity onPress={() => setAndroidPicker('time')}>
                  <Text style={styles.sheetRowValue}>{formatHour(draftStart)}</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.sheetRow}>
              <Ionicons name="hourglass-outline" size={18} color="#8E8E93" />
              <Text style={styles.sheetRowLabel}>Durée</Text>
              <View style={styles.stepper}>
                <TouchableOpacity
                  onPress={() => changeDuration(-DURATION_STEP)}
                  style={[styles.stepperButton, draftDuration <= MIN_DURATION && styles.stepperButtonDisabled]}
                  disabled={draftDuration <= MIN_DURATION}
                >
                  <Ionicons name="remove" size={16} color="#000" />
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{formatDuration(draftDuration)}</Text>
                <TouchableOpacity
                  onPress={() => changeDuration(DURATION_STEP)}
                  style={[styles.stepperButton, draftDuration >= MAX_DURATION && styles.stepperButtonDisabled]}
                  disabled={draftDuration >= MAX_DURATION}
                >
                  <Ionicons name="add" size={16} color="#000" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.sheetSummary}>
              {formatDayLabel(draftStart)} · {formatHour(draftStart)} → {formatHour(draftEnd)}
            </Text>

            <TouchableOpacity activeOpacity={0.8} style={styles.validateButton} onPress={validateDraft}>
              <Text style={styles.validateButtonText}>{editingId ? 'ENREGISTRER' : 'VALIDER CE CRÉNEAU'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {Platform.OS === 'android' && androidPicker && (
          <DateTimePicker
            value={draftStart}
            mode={androidPicker}
            display="default"
            minimumDate={androidPicker === 'date' ? new Date() : undefined}
            onChange={(_, d) => {
              const picker = androidPicker;
              setAndroidPicker(null);
              if (!d) return;
              if (picker === 'date') updateDraftDate(d);
              else updateDraftTime(d);
            }}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  intro: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyAddCard: {
    alignItems: 'center',
    paddingVertical: 28,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: BrandColors.success,
    backgroundColor: '#F6FBEE',
  },
  emptyAddIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyAddTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
  },
  emptyAddSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  addAnotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: BrandColors.success,
    backgroundColor: '#F6FBEE',
    marginBottom: 12,
  },
  addAnotherText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3D6B16',
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  slotIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F9EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  slotTexts: {
    flex: 1,
  },
  slotDay: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  slotTime: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F7',
    marginBottom: 8,
  },
  sheetCancel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    width: 70,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000',
  },
  sheetHeaderSpacer: {
    width: 70,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F7',
  },
  sheetRowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  sheetRowValue: {
    fontSize: 15,
    fontWeight: '600',
    color: BrandColors.success,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonDisabled: {
    opacity: 0.3,
  },
  stepperValue: {
    minWidth: 52,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  sheetSummary: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  validateButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  validateButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.5,
  },
});
