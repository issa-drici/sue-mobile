import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BrandColors } from '../../../constants/Colors';

const PROPOSED_HOURS = ['09:00', '10:00', '12:00', '14:00', '16:00', '18:00', '19:00', '20:00', '21:00'];
const DAYS_PAGE = 7;
const MAX_DAYS = 28;
const DURATION_STEP = 30;
const MIN_DURATION = 30;
const MAX_DURATION = 240;

const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Identifiant d'un créneau proposé : "YYYY-MM-DD|HH:mm" (heure locale). */
export const slotKey = (date: Date, time: string) => `${toDateKey(date)}|${time}`;

export const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
};

// "09:00" → "9h", "18:30" → "18h30"
const formatHour = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
};

const formatDayLabel = (date: Date, index: number) => {
  if (index === 0) return "Aujourd'hui";
  if (index === 1) return 'Demain';
  const label = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

export interface SlotPickerProps {
  durationMinutes: number;
  onDurationChange: (minutes: number) => void;
  selectedSlots: string[];
  onToggleSlot: (key: string) => void;
}

export function SlotPicker({ durationMinutes, onDurationChange, selectedSlots, onToggleSlot }: SlotPickerProps) {
  const [daysToShow, setDaysToShow] = useState(DAYS_PAGE);

  const days = useMemo(() => {
    const now = new Date();
    const result: { date: Date; label: string; hours: string[] }[] = [];
    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const hours = PROPOSED_HOURS.filter((time) => {
        if (i > 0) return true;
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m > now.getHours() * 60 + now.getMinutes();
      });
      if (hours.length > 0) {
        result.push({ date, label: formatDayLabel(date, i), hours });
      }
    }
    return result;
  }, [daysToShow]);

  const changeDuration = (delta: number) => {
    const next = durationMinutes + delta;
    if (next < MIN_DURATION || next > MAX_DURATION) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDurationChange(next);
  };

  return (
    <View>
      <Text style={styles.intro}>
        Coche tous les moments où tu peux jouer. Tes joueurs indiqueront ensuite ceux qui leur conviennent.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>DURÉE DE LA SESSION</Text>
        <View style={styles.durationCard}>
          <Ionicons name="hourglass-outline" size={18} color="#8E8E93" style={styles.cardIcon} />
          <TouchableOpacity
            onPress={() => changeDuration(-DURATION_STEP)}
            style={[styles.stepperButton, durationMinutes <= MIN_DURATION && styles.stepperButtonDisabled]}
            disabled={durationMinutes <= MIN_DURATION}
          >
            <Ionicons name="remove" size={16} color="#000" />
          </TouchableOpacity>
          <Text style={styles.durationValue}>{formatDuration(durationMinutes)}</Text>
          <TouchableOpacity
            onPress={() => changeDuration(DURATION_STEP)}
            style={[styles.stepperButton, durationMinutes >= MAX_DURATION && styles.stepperButtonDisabled]}
            disabled={durationMinutes >= MAX_DURATION}
          >
            <Ionicons name="add" size={16} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>QUAND PEUX-TU JOUER ?</Text>
        {days.map(({ date, label, hours }) => (
          <View key={toDateKey(date)} style={styles.dayBlock}>
            <Text style={styles.dayLabel}>{label}</Text>
            <View style={styles.chipsRow}>
              {hours.map((time) => {
                const key = slotKey(date, time);
                const isSelected = selectedSlots.includes(key);
                return (
                  <TouchableOpacity
                    key={key}
                    activeOpacity={0.8}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      onToggleSlot(key);
                    }}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {formatHour(time)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {daysToShow < MAX_DAYS && (
          <TouchableOpacity
            style={styles.moreDaysButton}
            onPress={() => setDaysToShow((n) => Math.min(n + DAYS_PAGE, MAX_DAYS))}
          >
            <Ionicons name="add" size={16} color={BrandColors.success} />
            <Text style={styles.moreDaysText}>Voir 7 jours de plus</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E8E93',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  durationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
  },
  cardIcon: {
    marginRight: 12,
  },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonDisabled: {
    opacity: 0.3,
  },
  durationValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  dayBlock: {
    marginBottom: 16,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minWidth: 56,
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: BrandColors.primary,
    borderColor: BrandColors.success,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  chipTextSelected: {
    fontWeight: '800',
  },
  moreDaysButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  moreDaysText: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.success,
  },
});
