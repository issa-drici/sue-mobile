import { Ionicons } from '@expo/vector-icons';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  FlatList,
  Image,
  Keyboard,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAvoidingView, KeyboardProvider } from 'react-native-keyboard-controller';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSessionChat } from '../../hooks/useSessionChat';
import { SessionsApi } from '../../services/api/sessionsApi';
import { activeChat } from '../../services/chat/activeChat';
import {
  Ticks,
  mentionLabels,
  mentionQueryAt,
  mentionSuggestions,
  mentionsStillInText,
  seenBy,
  splitMentions,
  ticksFor,
} from '../../services/chat/chatLogic';
import { ChatMember, DisplayMessage } from '../../services/chat/types';
import { getSportEmoji } from '../../utils';
import { getSessionEndDate } from '../../utils/timeHelpers';
import { useAuth } from '../context/auth';

const VOLT = '#D4FC79';
const INK = '#0A0A0A';
const PAPER = '#FAFAFA';
const MUTED_TEXT = '#8A8F98';
const SEEN_BLUE = '#0A84FF';
const MAX_LENGTH = 2000;
// Deux messages du même auteur à moins de 5 min forment un groupe (prénom et avatar une seule fois)
const GROUP_WINDOW_MS = 5 * 60 * 1000;

type Row =
  | { kind: 'message'; key: string; message: DisplayMessage; firstOfGroup: boolean; lastOfGroup: boolean }
  | { kind: 'day'; key: string; label: string }
  | { kind: 'unread'; key: string }
  | { kind: 'typing'; key: string };

function dayLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (date.toDateString() === yesterday.toDateString()) return 'Hier';
  const label = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/** Texte du message avec les @mentions en gras (surlignées si c'est moi) */
function MessageText({ body, mentions, labels, meId, mine }: {
  body: string; mentions: string[]; labels: Map<string, string>; meId?: string; mine: boolean;
}) {
  const parts = splitMentions(body, mentions, labels);
  return (
    <Text style={[styles.messageText, mine && styles.messageTextMine]}>
      {parts.map((part, i) => (part.mentionId ? (
        <Text key={i} style={[styles.mention, part.mentionId === meId && styles.mentionMe]}>{part.text}</Text>
      ) : (
        <Text key={i}>{part.text}</Text>
      )))}
    </Text>
  );
}

function MemberAvatar({ member, size = 28 }: { member?: ChatMember; size?: number }) {
  const style = { width: size, height: size, borderRadius: size / 2 };
  if (member?.avatarUrl) {
    return <Image source={{ uri: member.avatarUrl }} style={[styles.avatar, style]} />;
  }
  return (
    <View style={[styles.avatar, styles.avatarFallback, style]}>
      <Text style={[styles.avatarInitial, { fontSize: size * 0.42 }]}>
        {(member?.firstname || '?').charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

const TYPING_AVATAR = 30; // avatar + bordure
const TYPING_AVATAR_STEP = 16;

/** Un point de « … » qui rebondit, décalé dans le temps pour faire la vague */
function TypingDot({ delay }: { delay: number }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withDelay(delay, withRepeat(withSequence(
      withTiming(-4, { duration: 280 }),
      withTiming(0, { duration: 280 }),
      withTiming(0, { duration: 340 }),
    ), -1));
  }, [delay, y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }], opacity: 0.45 + (-y.value / 4) * 0.55 }));
  return <Animated.View style={[styles.typingDot, style]} />;
}

/** Ceux qui écrivent, en bas de la conversation (avatars + bulle « … »), comme sur Snapchat */
function TypingIndicator({ users, membersById }: {
  users: { id: string; firstname: string }[];
  membersById: Map<string, ChatMember>;
}) {
  if (!users.length) return null;
  const names = users.length === 1
    ? `${users[0].firstname} écrit`
    : users.length === 2
      ? `${users[0].firstname} et ${users[1].firstname} écrivent`
      : `${users[0].firstname} et ${users.length - 1} autres écrivent`;
  return (
    <Animated.View entering={FadeInDown.springify().damping(14).stiffness(260)} exiting={FadeOut.duration(160)} style={styles.typingRow}>
      {/* Avatars superposés : positions fixes (des marges négatives se décalent dans une liste inversée) */}
      <View style={[styles.typingAvatars, { width: TYPING_AVATAR + Math.min(users.length - 1, 2) * TYPING_AVATAR_STEP }]}>
        {users.slice(0, 3).reverse().map((u, i, shown) => (
          <View key={u.id} style={[styles.typingAvatar, { left: (shown.length - 1 - i) * TYPING_AVATAR_STEP }]}>
            <MemberAvatar member={membersById.get(u.id) ?? { firstname: u.firstname } as ChatMember} size={TYPING_AVATAR - 4} />
          </View>
        ))}
      </View>
      <View>
        <View style={styles.typingBubble}>
          <TypingDot delay={0} />
          <TypingDot delay={140} />
          <TypingDot delay={280} />
        </View>
        <Text style={styles.typingCaption} numberOfLines={1}>{names}</Text>
      </View>
    </Animated.View>
  );
}

/**
 * Coches de mes messages :
 *  🕓 pas encore parti (envoi en cours ou pas de réseau) · ✓ envoyé ·
 *  ✓✓ bleues : lu par tous ceux qui n'ont pas refusé.
 * Pas de ✓✓ grises : sur WhatsApp elles veulent dire « distribué », une info qu'on n'a pas.
 * Qui a déjà lu (avant que tout le monde l'ait fait) : appui long sur le message.
 */

function MessageTicks({ ticks }: { ticks: Ticks }) {
  const icon = ticks === 'clock' ? 'time-outline' : ticks === 'sent' ? 'checkmark' : 'checkmark-done';
  const color = ticks === 'seenAll' ? SEEN_BLUE : 'rgba(10,10,10,0.45)';
  return (
    <Animated.View key={ticks} entering={ZoomIn.duration(180)}>
      <Ionicons name={icon} size={ticks === 'clock' ? 12 : 15} color={color} />
    </Animated.View>
  );
}

/** Appui long sur un de mes messages : qui l'a vu (comme « Infos du message » sur WhatsApp) */
function ReadInfoSheet({ message, seenBy, notSeen, onClose }: {
  message: DisplayMessage | null;
  seenBy: ChatMember[];
  notSeen: ChatMember[];
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={!!message} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]} onPress={() => {}}>
          <View style={styles.sheetHandle} />
          {message && (
            <View style={styles.sheetQuote}>
              <Text style={styles.sheetQuoteText} numberOfLines={3}>{message.body}</Text>
            </View>
          )}
          <View style={styles.sheetSectionHeader}>
            <Ionicons name="checkmark-done" size={16} color={SEEN_BLUE} />
            <Text style={styles.sheetSectionTitle}>Vu par {seenBy.length}</Text>
          </View>
          {seenBy.length === 0 && <Text style={styles.sheetEmpty}>Personne pour l’instant</Text>}
          {seenBy.map((m) => (
            <View key={m.id} style={styles.sheetMember}>
              <MemberAvatar member={m} size={30} />
              <Text style={styles.sheetMemberName}>{m.firstname} {m.lastname}</Text>
            </View>
          ))}
          {notSeen.length > 0 && (
            <>
              <View style={[styles.sheetSectionHeader, { marginTop: 14 }]}>
                <Ionicons name="checkmark" size={16} color={MUTED_TEXT} />
                <Text style={styles.sheetSectionTitle}>Pas encore vu</Text>
              </View>
              {notSeen.map((m) => (
                <View key={m.id} style={[styles.sheetMember, { opacity: 0.55 }]}>
                  <MemberAvatar member={m} size={30} />
                  <Text style={styles.sheetMemberName}>{m.firstname} {m.lastname}</Text>
                  {m.status === 'declined' && <Text style={styles.suggestionHint}>a refusé</Text>}
                </View>
              ))}
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/**
 * Un écran neuf par session : une notification d'une autre session réutilise cet écran
 * (pas d'empilement), mais tout son état (messages, saisie) doit repartir de zéro.
 */
export default function SessionChatRoute() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  return <SessionChatScreen key={sessionId} sessionId={sessionId} />;
}

function SessionChatScreen({ sessionId }: { sessionId: string }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const chat = useSessionChat(sessionId, user ? { id: user.id, firstname: user.firstname } : null);

  const [text, setText] = useState('');
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  // Position du curseur imposée une seule fois (après une mention). Un curseur contrôlé en
  // permanence fait sauter la saisie sur iOS.
  const [forcedSelection, setForcedSelection] = useState<{ start: number; end: number } | undefined>();
  const [mentioned, setMentioned] = useState<Map<string, string>>(new Map()); // id -> libellé inséré
  // Juste après un choix de mention : pas de suggestions jusqu'à la prochaine frappe (iOS renvoie
  // parfois l'ancienne position du curseur après l'insertion, ce qui rouvrirait la liste)
  const [suppressSuggestions, setSuppressSuggestions] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [newWhileScrolled, setNewWhileScrolled] = useState(0);
  const [infoMessage, setInfoMessage] = useState<DisplayMessage | null>(null);
  const listRef = useRef<FlatList<Row>>(null);
  const inputRef = useRef<TextInput>(null);
  // Messages déjà affichés une fois : seuls les nouveaux arrivent avec une animation
  // (pas l'historique au chargement, ni une ligne qui revient à l'écran en défilant)
  const seenKeysRef = useRef<Set<string> | null>(null);
  const scrolledUpRef = useRef(false);
  const lastMaxIdRef = useRef<number | null>(null);
  const sendScale = useSharedValue(0.85);

  const meId = user?.id;
  const membersById = useMemo(() => new Map(chat.members.map((m) => [m.id, m])), [chat.members]);
  const labels = useMemo(() => mentionLabels(chat.members), [chat.members]);

  // Titre : sport et date de la session. Gardé avec le cache du chat pour s'afficher tout de suite
  // à la prochaine ouverture, puis rafraîchi depuis le serveur (une session peut changer de date).
  const { setHeader } = chat;
  useEffect(() => {
    SessionsApi.getById(sessionId)
      .then((session: any) => {
        const sport = session?.sport || '';
        const title = `${getSportEmoji(sport)} ${sport.charAt(0).toUpperCase()}${sport.slice(1)}`;
        let subtitle = 'Créneau à trouver';
        let endsAt: string | null = null;
        if (session?.scheduling !== 'finding_slot' && session?.date) {
          const date = new Date(session.date);
          const label = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
          subtitle = `${label}${session.startTime ? ` · ${String(session.startTime).slice(0, 5)}` : ''}`;
          endsAt = getSessionEndDate(session.date, session.endTime, session.startTime)?.toISOString() ?? null;
        }
        setHeader(title, subtitle, endsAt);
      })
      .catch(() => {});
  }, [sessionId, setHeader]);

  // Indicateur de chargement seulement si l'attente dure (premier affichage sans cache) : un
  // chargement rapide ne doit pas faire clignoter l'écran
  const [showSpinner, setShowSpinner] = useState(false);
  useEffect(() => {
    if (!chat.loading) {
      setShowSpinner(false);
      return;
    }
    const timer = setTimeout(() => setShowSpinner(true), 400);
    return () => clearTimeout(timer);
  }, [chat.loading]);

  // Chat affiché : pas de bannière pour ses messages, et lu au fur et à mesure
  useFocusEffect(useCallback(() => {
    activeChat.focus(sessionId);
    return () => activeChat.blur(sessionId);
  }, [sessionId]));

  // Ouvert dans la pile : une notification de ce chat y ramène au lieu d'en empiler un autre
  useEffect(() => activeChat.mount(sessionId), [sessionId]);

  // « Lu » seulement quand le chat est vraiment sous les yeux : écran au premier plan de la pile
  // et app active. Rejoué au retour sur l'écran ou dans l'app.
  const isFocused = useIsFocused();
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => setAppActive(state === 'active'));
    return () => sub.remove();
  }, []);
  const { markRead } = chat;
  useEffect(() => {
    if (isFocused && appActive) markRead();
  }, [chat.messages.length, isFocused, appActive, markRead]);

  // Titre : revient à la fiche de cette session si c'est l'écran juste en dessous, sinon l'ouvre
  const navigation = useNavigation();
  const openSession = () => {
    const state = navigation.getState();
    const previous = state?.routes[(state?.index ?? 0) - 1] as { name?: string; params?: { id?: string } } | undefined;
    if (previous?.name === 'session/[id]' && previous.params?.id === sessionId) {
      router.back();
    } else {
      router.navigate(`/session/${sessionId}`);
    }
  };

  useEffect(() => {
    if (chat.synced && seenKeysRef.current === null) {
      seenKeysRef.current = new Set(chat.messages.map((m) => m.clientId));
    }
  }, [chat.synced, chat.messages]);

  // Nouveaux messages des autres pendant qu'on lit plus haut : compteur sur la pastille.
  // Seuls ceux plus récents que le dernier connu comptent (pas l'historique chargé en remontant).
  useEffect(() => {
    const maxId = chat.messages.reduce((max, m) => (m.id !== null && m.id > max ? m.id : max), 0);
    const previous = lastMaxIdRef.current;
    if (previous !== null && maxId > previous && scrolledUpRef.current) {
      const added = chat.messages.filter((m) => m.id !== null && m.id > previous && m.senderId !== meId).length;
      if (added > 0) setNewWhileScrolled((n) => n + added);
    }
    if (!chat.loading) lastMaxIdRef.current = maxId;
  }, [chat.messages, chat.loading, meId]);

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  // Lignes de la liste, du plus récent au plus ancien (liste inversée : le bas = le plus récent)
  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    const list = chat.messages;
    const firstUnreadIndex = chat.initialLastReadId === null ? -1 : list.findIndex(
      (m) => m.id !== null
        && m.id > (chat.initialLastReadId ?? 0)
        && m.id <= (chat.initialLatestId ?? Infinity)
        && m.senderId !== meId
    );

    list.forEach((message, index) => {
      const prev = list[index - 1];
      const next = list[index + 1];
      const date = new Date(message.createdAt);
      if (!prev || new Date(prev.createdAt).toDateString() !== date.toDateString()) {
        out.push({ kind: 'day', key: `day-${date.toDateString()}`, label: dayLabel(date) });
      }
      if (index === firstUnreadIndex) {
        out.push({ kind: 'unread', key: 'unread' });
      }
      const sameAuthor = (a?: DisplayMessage) =>
        !!a && a.senderId === message.senderId
        && Math.abs(new Date(a.createdAt).getTime() - date.getTime()) < GROUP_WINDOW_MS
        && new Date(a.createdAt).toDateString() === date.toDateString();
      out.push({
        kind: 'message',
        key: message.clientId,
        message,
        firstOfGroup: !sameAuthor(prev) || index === firstUnreadIndex,
        lastOfGroup: !sameAuthor(next) || index + 1 === firstUnreadIndex,
      });
    });
    // Ceux qui écrivent : tout en bas, sous le dernier message
    if (chat.typingUsers.length) out.push({ kind: 'typing', key: 'typing' });
    return out.reverse();
  }, [chat.messages, chat.initialLastReadId, chat.initialLatestId, chat.typingUsers.length, meId]);

  // ---- « Vu » : qui a lu jusqu'à un message ----
  const others = useMemo(() => chat.members.filter((m) => m.id !== meId), [chat.members, meId]);
  const seenByOf = useCallback((messageId: number) => seenBy(messageId, others, chat.reads), [others, chat.reads]);
  const ticksOf = (message: DisplayMessage): Ticks => ticksFor(message.id, others, chat.reads);

  // ---- Mentions : « @pa » au curseur -> suggestions ----
  const mentionQuery = useMemo(() => mentionQueryAt(text, selection.start), [text, selection.start]);

  const suggestions = useMemo(() => {
    if (mentionQuery === null || suppressSuggestions) return [];
    // Mention déjà complétée (« @Mohamed ») : rien à proposer
    if (Array.from(mentioned.values()).some((label) => label.toLowerCase() === mentionQuery)) return [];
    return mentionSuggestions(mentionQuery, chat.members, labels, meId);
  }, [mentionQuery, suppressSuggestions, mentioned, chat.members, meId, labels]);

  const insertMention = (member: ChatMember) => {
    const label = labels.get(member.id) ?? member.firstname;
    const before = text.slice(0, selection.start).replace(/@([^\s@]*)$/, `@${label} `);
    const after = text.slice(selection.start);
    const next = before + after;
    setText(next);
    setSelection({ start: before.length, end: before.length });
    setForcedSelection({ start: before.length, end: before.length });
    setMentioned((prev) => new Map(prev).set(member.id, label));
    setSuppressSuggestions(true);
    Haptics.selectionAsync().catch(() => {});
  };

  const onChangeText = (value: string) => {
    // iOS renvoie parfois le texte qu'on vient d'insérer : ce n'est pas une frappe
    if (value.trimEnd() !== text.trimEnd()) setSuppressSuggestions(false);
    setText(value);
    if (value.trim()) chat.notifyTyping();
  };

  const onSend = () => {
    const body = text.trim();
    if (!body) return;
    sendScale.value = withSequence(withTiming(0.8, { duration: 70 }), withSpring(1, { damping: 9, stiffness: 300 }));
    // Ne garder que les mentions encore présentes dans le texte
    const mentionIds = mentionsStillInText(body, mentioned);
    chat.send(body, mentionIds);
    setText('');
    setMentioned(new Map());
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const onFailedPress = (message: DisplayMessage) => {
    const reason = chat.rejectionReason(message.clientId);
    Alert.alert(
      'Message non envoyé',
      reason ?? "Il partira tout seul dès que le réseau revient. Tu peux aussi le renvoyer maintenant.",
      [
        { text: 'Supprimer', style: 'destructive', onPress: () => chat.discard(message.clientId) },
        { text: 'Renvoyer', onPress: () => chat.retry(message.clientId) },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const up = event.nativeEvent.contentOffset.y > 300;
    scrolledUpRef.current = up;
    setShowScrollDown(up);
    if (!up) setNewWhileScrolled(0);
  };

  const scrollToBottom = () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
    setNewWhileScrolled(0);
  };

  const renderRow = ({ item }: { item: Row }) => {
    if (item.kind === 'day') {
      return (
        <View style={styles.dayRow}>
          <Text style={styles.dayLabel}>{item.label}</Text>
        </View>
      );
    }
    if (item.kind === 'typing') {
      return <TypingIndicator users={chat.typingUsers} membersById={membersById} />;
    }
    if (item.kind === 'unread') {
      return (
        <View style={styles.unreadRow}>
          <View style={styles.unreadLine} />
          <Text style={styles.unreadLabel}>Nouveaux messages</Text>
          <View style={styles.unreadLine} />
        </View>
      );
    }

    const { message, firstOfGroup, lastOfGroup } = item;
    const mine = message.senderId === meId;
    const sender = membersById.get(message.senderId);
    const failed = message.status === 'failed';
    const pending = message.status === 'sending' || message.status === 'waiting';

    const seen = seenKeysRef.current;
    const animate = !!seen && !seen.has(message.clientId);
    if (seen) seen.add(message.clientId);

    return (
      <Animated.View
        entering={animate ? (mine ? FadeInDown.springify().damping(16).stiffness(240) : FadeInDown.duration(260)) : undefined}
        style={[styles.messageBlock, lastOfGroup && styles.messageRowGroupEnd]}
      >
      <View style={[styles.messageRow, mine ? styles.messageRowMine : styles.messageRowOther]}>
        {mine && failed && (
          <TouchableOpacity onPress={() => onFailedPress(message)} hitSlop={10} style={styles.failedIcon} accessibilityLabel="Message non envoyé, réessayer">
            <Ionicons name="alert-circle" size={22} color="#E5484D" />
          </TouchableOpacity>
        )}
        {!mine && (
          <View style={styles.avatarSlot}>
            {lastOfGroup ? <MemberAvatar member={sender} /> : null}
          </View>
        )}
        <Pressable
          onPress={failed ? () => onFailedPress(message) : undefined}
          onLongPress={mine && message.id !== null ? () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            setInfoMessage(message);
          } : undefined}
          delayLongPress={300}
          style={({ pressed }) => [
            styles.bubble,
            mine ? styles.bubbleMine : styles.bubbleOther,
            mine && lastOfGroup && styles.bubbleMineTail,
            !mine && lastOfGroup && styles.bubbleOtherTail,
            pending && styles.bubblePending,
            failed && styles.bubbleFailed,
            pressed && mine && message.id !== null && styles.bubblePressed,
          ]}
        >
          {!mine && firstOfGroup && (
            <Text style={styles.senderName}>
              {sender?.firstname ?? message.senderFirstname ?? 'Ancien membre'}
              {sender?.isOrganizer ? <Text style={styles.organizerTag}>  Orga</Text> : null}
            </Text>
          )}
          <MessageText body={message.body} mentions={message.mentions} labels={labels} meId={meId} mine={mine} />
          <View style={styles.metaRow}>
            <Text style={[styles.time, mine && styles.timeMine]}>{timeLabel(message.createdAt)}</Text>
            {mine && !failed && <MessageTicks ticks={ticksOf(message)} />}
          </View>
        </Pressable>
      </View>
      </Animated.View>
    );
  };

  const canSend = text.trim().length > 0 && text.length <= MAX_LENGTH;

  useEffect(() => {
    sendScale.value = withSpring(canSend ? 1 : 0.85, { damping: 12, stiffness: 260 });
  }, [canSend, sendScale]);
  const sendButtonStyle = useAnimatedStyle(() => ({ transform: [{ scale: sendScale.value }] }));

  return (
    <KeyboardProvider>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        {/* En-tête */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.replace(`/session/${sessionId}`))}
            accessibilityLabel="Retour"
            testID="chat-back"
            style={styles.headerButton}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={24} color={INK} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerCenter} onPress={openSession} activeOpacity={0.7}>
            <Text style={styles.headerTitle} numberOfLines={1}>{chat.header?.title ?? ' '}</Text>
            {chat.isOnline ? (
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {[chat.header?.subtitle, chat.members.length ? `${chat.members.length} membres` : ''].filter(Boolean).join(' · ') || ' '}
              </Text>
            ) : (
              <Animated.View entering={FadeIn.duration(200)} style={styles.headerOffline}>
                <ActivityIndicator size="small" color={MUTED_TEXT} style={styles.headerOfflineSpinner} />
                <Text style={styles.headerSubtitle}>En attente du réseau…</Text>
              </Animated.View>
            )}
          </TouchableOpacity>
          {/* Même largeur que le bouton retour : le titre reste centré */}
          <View style={styles.headerButton} />
        </View>

        <KeyboardAvoidingView behavior="padding" style={styles.flex}>
          {!chat.hydrated || (chat.loading && !chat.loadError) ? (
            // Lecture du cache (quelques ms, masquée par l'animation d'ouverture) ou tout premier
            // chargement : écran neutre, indicateur seulement si ça dure
            <View style={styles.center}>
              {showSpinner && <ActivityIndicator color={MUTED_TEXT} />}
            </View>
          ) : chat.loadError ? (
            <View style={styles.center}>
              <Text style={styles.emptyTitle}>{chat.loadError}</Text>
              <TouchableOpacity onPress={chat.reload} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.flex}>
              <FlatList
                ref={listRef}
                data={rows}
                inverted
                keyExtractor={(row) => row.key}
                renderItem={renderRow}
                onEndReached={chat.loadOlder}
                onEndReachedThreshold={0.4}
                onScroll={onScroll}
                scrollEventThrottle={64}
                keyboardDismissMode="interactive"
                keyboardShouldPersistTaps="handled"
                maintainVisibleContentPosition={{ minIndexForVisible: 0, autoscrollToTopThreshold: 120 }}
                contentContainerStyle={styles.listContent}
                ListFooterComponent={chat.loadingOlder ? <ActivityIndicator style={styles.olderSpinner} color={MUTED_TEXT} /> : null}
                ListEmptyComponent={
                  <View style={[styles.empty, { transform: [{ scaleY: -1 }] }]}>
                    <Text style={styles.emptyEmoji}>💬</Text>
                    <Text style={styles.emptyTitle}>Lance la discussion</Text>
                    <Text style={styles.emptyText}>Tous les invités voient les messages. Tape @ pour mentionner quelqu’un.</Text>
                  </View>
                }
              />
              {showScrollDown && (
                <Animated.View entering={ZoomIn.springify().damping(14)} exiting={ZoomOut.duration(140)} style={styles.scrollDownWrap}>
                  <TouchableOpacity
                    style={[styles.scrollDown, newWhileScrolled > 0 && styles.scrollDownWithCount]}
                    onPress={scrollToBottom}
                    accessibilityLabel="Revenir aux derniers messages"
                  >
                    {newWhileScrolled > 0 && (
                      <Text style={styles.scrollDownCount}>
                        {newWhileScrolled} nouveau{newWhileScrolled > 1 ? 'x' : ''}
                      </Text>
                    )}
                    <Ionicons name="chevron-down" size={20} color={INK} />
                  </TouchableOpacity>
                </Animated.View>
              )}
            </View>
          )}

          {/* Suggestions de mention */}
          {suggestions.length > 0 && (
            <Animated.View entering={FadeInDown.duration(160)} exiting={FadeOut.duration(120)} style={styles.suggestions}>
              {suggestions.map((member) => (
                <TouchableOpacity key={member.id} testID={`mention-suggestion-${member.firstname}`} style={styles.suggestion} onPress={() => insertMention(member)}>
                  <MemberAvatar member={member} size={30} />
                  <Text style={styles.suggestionName}>{member.firstname} {member.lastname}</Text>
                  {member.status === 'declined' && <Text style={styles.suggestionHint}>a refusé</Text>}
                  {member.isOrganizer && <Text style={styles.suggestionHint}>orga</Text>}
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}

          {/* Saisie */}
          <View style={[styles.composer, { paddingBottom: keyboardVisible ? 8 : Math.max(insets.bottom, 8) }]}>
            <TextInput
              ref={inputRef}
              testID="chat-input"
              style={styles.input}
              value={text}
              onChangeText={onChangeText}
              selection={forcedSelection}
              onSelectionChange={(e) => {
                setSelection(e.nativeEvent.selection);
                if (forcedSelection) setForcedSelection(undefined);
              }}
              placeholder="Message"
              placeholderTextColor={MUTED_TEXT}
              multiline
              maxLength={MAX_LENGTH + 50}
              editable={chat.hydrated && !chat.loadError}
            />
            <Animated.View style={sendButtonStyle}>
              <TouchableOpacity
                onPress={onSend}
                testID="chat-send"
                disabled={!canSend}
                style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
                accessibilityLabel="Envoyer"
              >
                <Ionicons name="arrow-up" size={20} color={canSend ? INK : '#B7BBC2'} />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </View>
      <ReadInfoSheet
        message={infoMessage}
        seenBy={infoMessage?.id ? seenByOf(infoMessage.id) : []}
        notSeen={infoMessage?.id ? others.filter((m) => (chat.reads[m.id] ?? 0) < (infoMessage.id ?? 0)) : []}
        onClose={() => setInfoMessage(null)}
      />
    </KeyboardProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: PAPER },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E6E8EB',
    backgroundColor: PAPER,
  },
  headerButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  headerTitle: { fontFamily: 'Outfit-Bold', fontSize: 17, color: INK },
  headerSubtitle: { fontSize: 12, color: MUTED_TEXT, marginTop: 1 },

  listContent: { paddingHorizontal: 12, paddingVertical: 12, flexGrow: 1 },
  olderSpinner: { marginVertical: 12 },

  dayRow: { alignItems: 'center', marginVertical: 12 },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED_TEXT,
    backgroundColor: '#EEF0F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  unreadRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 10, gap: 8 },
  unreadLine: { flex: 1, height: 1, backgroundColor: '#DCE7C2' },
  unreadLabel: { fontSize: 12, fontWeight: '700', color: '#5C7F1F' },

  messageBlock: { marginBottom: 2 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end' },
  messageRowMine: { justifyContent: 'flex-end', paddingLeft: 48 },
  messageRowOther: { justifyContent: 'flex-start', paddingRight: 48 },
  messageRowGroupEnd: { marginBottom: 10 },
  avatarSlot: { width: 28, marginRight: 6 },
  avatar: { backgroundColor: '#E9ECEF' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: 'Outfit-Bold', color: INK },

  bubble: { paddingHorizontal: 12, paddingTop: 7, paddingBottom: 6, borderRadius: 18, maxWidth: '100%' },
  bubbleMine: { backgroundColor: VOLT },
  bubbleOther: { backgroundColor: '#FFFFFF', borderWidth: StyleSheet.hairlineWidth, borderColor: '#E3E6EA' },
  bubbleMineTail: { borderBottomRightRadius: 6 },
  bubbleOtherTail: { borderBottomLeftRadius: 6 },
  bubblePending: { opacity: 0.6 },
  bubbleFailed: { backgroundColor: '#FDECEC', borderWidth: 1, borderColor: '#F5C2C4' },
  senderName: { fontFamily: 'Outfit-Bold', fontSize: 13, color: '#4B6B14', marginBottom: 2 },
  organizerTag: { fontSize: 11, fontWeight: '600', color: MUTED_TEXT },
  messageText: { fontSize: 16, lineHeight: 21, color: INK },
  messageTextMine: { color: INK },
  mention: { fontWeight: '700' },
  mentionMe: { backgroundColor: 'rgba(212,252,121,0.55)' },
  metaRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: 3, marginTop: 2 },
  time: { fontSize: 11, color: MUTED_TEXT },
  timeMine: { color: 'rgba(10,10,10,0.5)' },
  failedIcon: { marginRight: 6, marginBottom: 8 },
  bubblePressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },

  headerOffline: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 },
  headerOfflineSpinner: { transform: [{ scale: 0.7 }] },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFF', borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 20, paddingTop: 10 },
  sheetHandle: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, backgroundColor: '#DADDE1', marginBottom: 14 },
  sheetQuote: { backgroundColor: VOLT, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, alignSelf: 'flex-end', maxWidth: '85%', marginBottom: 16 },
  sheetQuoteText: { fontSize: 15, color: INK },
  sheetSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  sheetSectionTitle: { fontFamily: 'Outfit-Bold', fontSize: 15, color: INK },
  sheetEmpty: { fontSize: 14, color: MUTED_TEXT, paddingVertical: 6 },
  sheetMember: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  sheetMemberName: { fontSize: 15, fontWeight: '600', color: INK, flex: 1 },

  typingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 4, marginBottom: 6 },
  typingAvatars: { height: TYPING_AVATAR, marginTop: 2 },
  typingAvatar: { position: 'absolute', top: 0, borderRadius: TYPING_AVATAR / 2, borderWidth: 2, borderColor: PAPER },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E3E6EA',
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  typingDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#5B6270' },
  typingCaption: { fontSize: 11, color: MUTED_TEXT, marginTop: 3, marginLeft: 4 },


  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { fontFamily: 'Outfit-Bold', fontSize: 18, color: INK, textAlign: 'center' },
  emptyText: { fontSize: 14, color: MUTED_TEXT, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  retryButton: { marginTop: 14, backgroundColor: INK, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 },
  retryButtonText: { color: '#FFF', fontWeight: '700' },

  scrollDownWrap: { position: 'absolute', right: 14, bottom: 12 },
  scrollDownWithCount: { width: 'auto', paddingLeft: 14, paddingRight: 10, flexDirection: 'row', gap: 4, backgroundColor: VOLT },
  scrollDownCount: { fontSize: 13, fontWeight: '700', color: INK },
  scrollDown: {
    minWidth: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  suggestions: {
    backgroundColor: '#FFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E6E8EB',
    paddingVertical: 4,
  },
  suggestion: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, gap: 10 },
  suggestionName: { fontSize: 15, fontWeight: '600', color: INK, flex: 1 },
  suggestionHint: { fontSize: 12, color: MUTED_TEXT },

  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingTop: 8,
    gap: 8,
    backgroundColor: PAPER,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E6E8EB',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#DADDE1',
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 16,
    color: INK,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: VOLT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { backgroundColor: '#EEF0F2' },
});
