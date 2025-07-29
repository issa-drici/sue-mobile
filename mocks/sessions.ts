import { SportSession } from '../types/sport';

export const mockSessions: SportSession[] = [
  {
    id: '1',
    sport: 'tennis',
    date: '2024-03-25',
    time: '18:00',
    location: 'Tennis Club de Paris',
    maxParticipants: 8, // ✅ Ajouter maxParticipants
    organizer: {
      id: '1',
      firstname: 'Jean',
      lastname: 'Dupont'
    },
    participants: [
      {
        id: '1',
        firstname: 'Jean',
        lastname: 'Dupont',
        status: 'accepted'
      },
      {
        id: '2',
        firstname: 'Marie',
        lastname: 'Martin',
        status: 'pending'
      }
    ],
    comments: [
      {
        id: '1',
        userId: '1',
        firstname: 'Jean',
        lastname: 'Dupont',
        content: 'N\'oubliez pas vos raquettes !',
        createdAt: '2024-03-20T10:00:00Z'
      }
    ]
  },
  {
    id: '2',
    sport: 'golf',
    date: '2024-03-26',
    time: '14:00',
    location: 'Golf Club de Versailles',
    organizer: {
      id: '2',
      firstname: 'Marie',
      lastname: 'Martin'
    },
    participants: [
      {
        id: '1',
        firstname: 'Jean',
        lastname: 'Dupont',
        status: 'accepted'
      },
      {
        id: '2',
        firstname: 'Marie',
        lastname: 'Martin',
        status: 'accepted'
      }
    ],
    comments: []
  }
]; 