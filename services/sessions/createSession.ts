import { useCallback, useState } from "react";
import { useAuth } from "../../app/context/auth";
import { ENV } from "../../config/env";
import { SportSession } from "../../types/sport";
import { SessionsApi } from "../api/sessionsApi";
import { CreateSessionData } from "../types/sessions";

// Fonction de conversion de SportSession vers CreateSessionData
function convertToCreateSessionData(
  sessionData: Partial<SportSession>
): CreateSessionData {
  // Extraire les IDs des participants
  const participantIds = sessionData.participants?.map((p) => p.id) || [];

  return {
    title: sessionData.sport, // Utiliser le sport comme titre
    date: sessionData.date || new Date().toISOString().split("T")[0],
    startTime: sessionData.startTime || "18:00",
    endTime: sessionData.endTime || "20:00",
    location: sessionData.location || "Lieu par défaut",
    sport: sessionData.sport || "tennis",
    maxParticipants: sessionData.maxParticipants ?? null,
    pricePerPerson: sessionData.pricePerPerson ?? null,
    participantIds: participantIds, // ✅ Ajouter les IDs des participants
  };
}

// Fonction de conversion de Session vers SportSession
function convertToSportSession(session: any): SportSession {
  // Adapter selon la structure réelle de l'API
  const organizerName = session.organizer?.fullName || "Organisateur";
  const nameParts = organizerName.split(" ");

  return {
    id: session.id,
    sport: session.sport,
    date: session.date,
    startTime: session.startTime || session.time || "18:00",
    endTime: session.endTime || "20:00",
    location: session.location,
    maxParticipants: session.maxParticipants,
    pricePerPerson: session.pricePerPerson,
    organizer: {
      id: session.organizer?.id || "",
      firstname: nameParts[0] || "",
      lastname: nameParts.slice(1).join(" ") || "",
    },
    participants: session.participants || [],
    comments: (session.comments || []).map((comment: any) => ({
      id: comment.id,
      userId: comment.authorId || comment.userId,
      firstname: comment.authorName?.split(" ")[0] || comment.firstname || "",
      lastname:
        comment.authorName?.split(" ").slice(1).join(" ") ||
        comment.lastname ||
        "",
      content: comment.content,
      createdAt: comment.createdAt,
    })),
  };
}

export function useCreateSession() {
  const { user } = useAuth();
  const [data, setData] = useState<SportSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSession = useCallback(
    async (sessionData: Partial<SportSession>) => {
      setIsLoading(true);
      setError(null);

      try {
        if (ENV.USE_MOCKS) {
          const newSession: SportSession = {
            id: Date.now().toString(),
            sport: sessionData.sport || "tennis",
            date: sessionData.date || new Date().toISOString().split("T")[0],
            startTime: sessionData.startTime || "18:00",
            endTime: sessionData.endTime || "20:00",
            location: sessionData.location || "Lieu par défaut",
            maxParticipants: sessionData.maxParticipants ?? null,
            pricePerPerson: sessionData.pricePerPerson ?? null,
            organizer: sessionData.organizer || {
              id: user?.id || "1",
              firstname: user?.firstname || "Utilisateur",
              lastname: user?.lastname || "Test",
            },
            participants: sessionData.participants || [],
            comments: sessionData.comments || [],
          };
          setData(newSession);
          return newSession;
        } else {
          const createData = convertToCreateSessionData(sessionData);
          const response = await SessionsApi.create(createData);

          // Extraire les données de la réponse Laravel
          const sessionResponse = (response as any).data || response;
          const sportSession = convertToSportSession(sessionResponse);

          setData(sportSession);
          return sportSession;
        }
      } catch (err: any) {
        setError(err.message || "Erreur lors de la création de la session");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  return {
    data,
    isLoading,
    error,
    createSession,
  };
}
