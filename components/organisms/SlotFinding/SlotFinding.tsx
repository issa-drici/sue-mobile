import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BrandColors } from '../../../constants/Colors';
import { SlotProposal, SportSession } from '../../../types/sport';

// "Trouver un créneau" : cartes affichées sur la page session tant que le créneau n'est pas confirmé.
// L'invité coche ses disponibilités ; l'organisateur voit les réponses et confirme un créneau.

const pad = (n: number) => String(n).padStart(2, '0');

const slotKey = (slot: SlotProposal) => slot.id ?? `${slot.date}-${slot.startTime}`;

/** "18:00" → "18h", "18:30" → "18h30" */
const formatHour = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return m === 0 ? `${h}h` : `${h}h${pad(m)}`;
};

/** "Lundi 26 octobre" */
export const formatSlotDay = (slot: SlotProposal) => {
  const [y, mo, d] = slot.date.split('-').map(Number);
  const label = new Date(y, mo - 1, d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const formatSlotTime = (slot: SlotProposal) => `${formatHour(slot.startTime)} → ${formatHour(slot.endTime)}`;

/** "lundi 26 à 18h" (pour le bouton de confirmation) */
const formatSlotShort = (slot: SlotProposal) => {
  const [y, mo, d] = slot.date.split('-').map(Number);
  const weekday = new Date(y, mo - 1, d).toLocaleDateString('fr-FR', { weekday: 'long' });
  return `${weekday} ${d} à ${formatHour(slot.startTime)}`;
};

const availabilityLabel = (count: number) => (count === 0 ? 'Personne' : count === 1 ? '1 dispo' : `${count} dispos`);

/* ------------------------------------------------------------------ */
/* Invité : "Quand peux-tu jouer ?"                                    */
/* ------------------------------------------------------------------ */

interface SlotAvailabilityCardProps {
  session: SportSession;
  userId: string;
  isSending: boolean;
  onSend: (slotIds: string[]) => void;
}

export function SlotAvailabilityCard({ session, userId, isSending, onSend }: SlotAvailabilityCardProps) {
  const slots = useMemo(() => session.slotProposals ?? [], [session.slotProposals]);
  const me = session.participants.find((p) => p.id === userId);
  const hasResponded = !!me?.hasGivenAvailability;
  // Un créneau a été ajouté après sa réponse : il doit pouvoir revalider même sans rien changer
  const hasNewSlots = !!me?.hasNewSlots;

  const savedSlotIds = useMemo(
    () => slots.filter((s) => s.availableUserIds?.includes(userId)).map(slotKey),
    [slots, userId]
  );
  const [selected, setSelected] = useState<string[]>(savedSlotIds);
  // Resynchroniser après un rafraîchissement de la session
  useEffect(() => setSelected(savedSlotIds), [savedSlotIds]);

  const isDirty =
    selected.length !== savedSlotIds.length || selected.some((id) => !savedSlotIds.includes(id));

  const toggle = (id: string) => {
    Haptics.selectionAsync();
    setSelected((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  };

  const statusLine = !hasResponded
    ? null
    : savedSlotIds.length === 0
      ? "Tu as indiqué qu'aucun créneau ne te va."
      : `Réponse envoyée : ${savedSlotIds.length} créneau${savedSlotIds.length > 1 ? 'x' : ''}. Modifiable jusqu'à la confirmation.`;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Quand peux-tu jouer ?</Text>
      <Text style={styles.subtitle}>
        Coche tous les créneaux qui te vont. Si l'un d'eux est retenu, tu es inscrit automatiquement.
      </Text>

      {hasNewSlots ? (
        <View style={styles.newSlotBanner}>
          <Ionicons name="sparkles-outline" size={16} color="#000" />
          <Text style={styles.newSlotBannerText}>Nouveau créneau proposé : coche-le si tu es dispo.</Text>
        </View>
      ) : null}

      <View style={styles.slotList}>
        {slots.map((slot) => {
          const id = slotKey(slot);
          const isOn = selected.includes(id);
          return (
            <TouchableOpacity
              key={id}
              activeOpacity={0.8}
              onPress={() => toggle(id)}
              style={[styles.slotRow, isOn && styles.slotRowSelected]}
            >
              <Ionicons
                name={isOn ? 'checkbox' : 'square-outline'}
                size={22}
                color={isOn ? BrandColors.darkPink : '#C7C7CC'}
              />
              <View style={styles.slotTexts}>
                <Text style={styles.slotDay}>{formatSlotDay(slot)}</Text>
                <Text style={styles.slotTime}>{formatSlotTime(slot)}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {statusLine && !isDirty && !hasNewSlots ? (
        <View style={styles.statusRow}>
          <Ionicons name="checkmark-circle" size={16} color={BrandColors.darkPink} />
          <Text style={styles.statusText}>{statusLine}</Text>
        </View>
      ) : null}

      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.primaryButton, (selected.length === 0 || isSending || (hasResponded && !isDirty && !hasNewSlots)) && styles.buttonDisabled]}
        disabled={selected.length === 0 || isSending || (hasResponded && !isDirty && !hasNewSlots)}
        onPress={() => onSend(selected)}
      >
        {isSending ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.primaryButtonText}>
            {hasResponded ? 'Mettre à jour mes disponibilités' : 'Envoyer mes disponibilités'}
          </Text>
        )}
      </TouchableOpacity>

      {!(hasResponded && savedSlotIds.length === 0) ? (
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.secondaryButton}
          disabled={isSending}
          onPress={() => onSend([])}
        >
          <Text style={styles.secondaryButtonText}>Aucun créneau ne me va</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Organisateur : réponses par créneau + confirmation                  */
/* ------------------------------------------------------------------ */

interface SlotConfirmCardProps {
  session: SportSession;
  isConfirming: boolean;
  onConfirm: (slot: SlotProposal) => void;
  onInvite: () => void;
  onEditSlots: () => void;
}

export function SlotConfirmCard({ session, isConfirming, onConfirm, onInvite, onEditSlots }: SlotConfirmCardProps) {
  const organizerId = session.organizer.id;
  const invitees = session.participants.filter((p) => p.id !== organizerId && p.status !== 'declined');
  // Un invité qui a répondu avant l'ajout d'un créneau n'a pas encore donné son avis dessus
  const responded = invitees.filter((p) => p.hasGivenAvailability && !p.hasNewSlots);
  const waiting = invitees.filter((p) => !p.hasGivenAvailability || p.hasNewSlots);

  // Plus de disponibles d'abord ; à égalité, le plus tôt
  const rankedSlots = useMemo(
    () =>
      [...(session.slotProposals ?? [])].sort(
        (a, b) =>
          (b.availabilityCount ?? 0) - (a.availabilityCount ?? 0) ||
          `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)
      ),
    [session.slotProposals]
  );

  const [chosenId, setChosenId] = useState<string | null>(null);
  const chosenSlot = rankedSlots.find((s) => slotKey(s) === chosenId) ?? rankedSlots[0];

  const firstNameOf = (userId: string) => session.participants.find((p) => p.id === userId)?.firstname || '?';

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Choisis le créneau</Text>
      <Text style={styles.subtitle}>
        {rankedSlots.length === 0
          ? "Aucun créneau à venir : les créneaux proposés sont passés. Ajoutes-en de nouveaux."
          : invitees.length === 0
          ? 'Invite des joueurs pour récolter leurs disponibilités.'
          : `${responded.length}/${invitees.length} ${responded.length > 1 ? 'ont' : 'a'} répondu`}
      </Text>

      <View style={styles.slotList}>
        {rankedSlots.map((slot) => {
          const id = slotKey(slot);
          const isChosen = chosenSlot && slotKey(chosenSlot) === id;
          const names = (slot.availableUserIds ?? []).map(firstNameOf);
          return (
            <TouchableOpacity
              key={id}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.selectionAsync();
                setChosenId(id);
              }}
              style={[styles.slotRow, isChosen && styles.slotRowSelected]}
            >
              <Ionicons
                name={isChosen ? 'radio-button-on' : 'radio-button-off'}
                size={22}
                color={isChosen ? BrandColors.darkPink : '#C7C7CC'}
              />
              <View style={styles.slotTexts}>
                <Text style={styles.slotDay}>{formatSlotDay(slot)}</Text>
                <Text style={styles.slotTime}>{formatSlotTime(slot)}</Text>
                {names.length > 0 ? (
                  <Text style={styles.slotNames} numberOfLines={1}>
                    {names.join(', ')}
                  </Text>
                ) : null}
              </View>
              <View style={[styles.countPill, (slot.availabilityCount ?? 0) > 0 && styles.countPillActive]}>
                <Text style={styles.countPillText}>{availabilityLabel(slot.availabilityCount ?? 0)}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {waiting.length > 0 ? (
        <Text style={styles.waitingText}>
          Pas encore répondu : {waiting.map((p) => p.firstname).join(', ')}
        </Text>
      ) : null}

      {rankedSlots.length === 0 ? (
        <TouchableOpacity activeOpacity={0.8} style={styles.primaryButton} onPress={onEditSlots}>
          <Text style={styles.primaryButtonText}>Ajouter des créneaux</Text>
        </TouchableOpacity>
      ) : invitees.length === 0 ? (
        <TouchableOpacity activeOpacity={0.8} style={styles.primaryButton} onPress={onInvite}>
          <Text style={styles.primaryButtonText}>Inviter des joueurs</Text>
        </TouchableOpacity>
      ) : chosenSlot ? (
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.primaryButton, isConfirming && styles.buttonDisabled]}
          disabled={isConfirming}
          onPress={() => onConfirm(chosenSlot)}
        >
          {isConfirming ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.primaryButtonText}>Confirmer {formatSlotShort(chosenSlot)}</Text>
          )}
        </TouchableOpacity>
      ) : null}

      {rankedSlots.length > 0 ? (
        <TouchableOpacity activeOpacity={0.7} style={styles.secondaryButton} onPress={onEditSlots}>
          <Text style={styles.secondaryButtonText}>Modifier les créneaux</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F0F0F2',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 16,
    lineHeight: 18,
  },
  slotList: {
    gap: 8,
    marginBottom: 12,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    backgroundColor: '#FFF',
  },
  slotRowSelected: {
    borderColor: BrandColors.darkPink,
    backgroundColor: '#F7FBEF',
  },
  slotTexts: {
    flex: 1,
    gap: 2,
  },
  slotDay: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  slotTime: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555',
  },
  slotNames: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: 2,
  },
  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#F5F5F7',
  },
  countPillActive: {
    backgroundColor: BrandColors.primary,
  },
  countPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  waitingText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 12,
  },
  newSlotBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BrandColors.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  newSlotBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  statusText: {
    flex: 1,
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  primaryButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: BrandColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  secondaryButton: {
    alignItems: 'center',
    paddingTop: 14,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
});
