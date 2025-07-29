import { Notification } from '../types/notification';

export const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'invitation',
    title: 'Nouvelle invitation',
    message: 'Jean Dupont vous invite à une session de tennis',
    sessionId: '1',
    createdAt: new Date().toISOString(),
    read: false,
  },
  {
    id: '2',
    type: 'invitation',
    title: 'Nouvelle invitation',
    message: 'Marie Martin vous invite à une session de football',
    sessionId: '2',
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 heure avant
    read: false,
  },
  {
    id: '3',
    type: 'reminder',
    title: 'Rappel de session',
    message: 'Votre session de tennis commence dans 1 heure',
    sessionId: '3',
    createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 heures avant
    read: true,
  },
  {
    id: '4',
    type: 'update',
    title: 'Session modifiée',
    message: 'La session de golf a été reportée à 16h00',
    sessionId: '2',
    createdAt: new Date(Date.now() - 10800000).toISOString(), // 3 heures avant
    read: false,
  },
  {
    id: '5',
    type: 'invitation',
    title: 'Nouvelle invitation',
    message: 'Pierre Durand vous invite à une session de musculation',
    sessionId: '4',
    createdAt: new Date(Date.now() - 14400000).toISOString(), // 4 heures avant
    read: true,
  },
]; 