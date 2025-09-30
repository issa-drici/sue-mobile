/**
 * Tests pour les utilitaires de gestion des heures
 */

import { roundToNearestHalfHour, addOneHour, isValidEndTime, getDefaultEndTime } from '../timeHelpers';

describe('timeHelpers', () => {
  describe('roundToNearestHalfHour', () => {
    it('devrait arrondir à l\'heure pleine quand les minutes sont <= 15', () => {
      const date = new Date('2000-01-01T14:10:00');
      const result = roundToNearestHalfHour(date);
      expect(result.getMinutes()).toBe(0);
      expect(result.getHours()).toBe(14);
    });

    it('devrait arrondir à la demi-heure quand les minutes sont entre 16 et 45', () => {
      const date = new Date('2000-01-01T14:25:00');
      const result = roundToNearestHalfHour(date);
      expect(result.getMinutes()).toBe(30);
      expect(result.getHours()).toBe(14);
    });

    it('devrait arrondir à l\'heure suivante quand les minutes sont > 45', () => {
      const date = new Date('2000-01-01T14:50:00');
      const result = roundToNearestHalfHour(date);
      expect(result.getMinutes()).toBe(0);
      expect(result.getHours()).toBe(15);
    });
  });

  describe('addOneHour', () => {
    it('devrait ajouter une heure à une date', () => {
      const date = new Date('2000-01-01T14:30:00');
      const result = addOneHour(date);
      expect(result.getHours()).toBe(15);
      expect(result.getMinutes()).toBe(30);
    });
  });

  describe('isValidEndTime', () => {
    it('devrait retourner true si l\'heure de fin est après l\'heure de début', () => {
      const startTime = new Date('2000-01-01T14:00:00');
      const endTime = new Date('2000-01-01T15:00:00');
      expect(isValidEndTime(startTime, endTime)).toBe(true);
    });

    it('devrait retourner false si l\'heure de fin est égale à l\'heure de début', () => {
      const startTime = new Date('2000-01-01T14:00:00');
      const endTime = new Date('2000-01-01T14:00:00');
      expect(isValidEndTime(startTime, endTime)).toBe(false);
    });

    it('devrait retourner false si l\'heure de fin est avant l\'heure de début', () => {
      const startTime = new Date('2000-01-01T14:00:00');
      const endTime = new Date('2000-01-01T13:00:00');
      expect(isValidEndTime(startTime, endTime)).toBe(false);
    });
  });

  describe('getDefaultEndTime', () => {
    it('devrait retourner l\'heure de début + 1 heure', () => {
      const startTime = new Date('2000-01-01T14:30:00');
      const result = getDefaultEndTime(startTime);
      expect(result.getHours()).toBe(15);
      expect(result.getMinutes()).toBe(30);
    });
  });
});
