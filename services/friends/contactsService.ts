import * as Contacts from 'expo-contacts';

export interface NormalizedContact {
  id: string;
  name: string;
  phoneNumbers: string[];
}

class ContactsService {
  /**
   * Request permissions and fetch contacts with phone numbers
   */
  async getAllContacts(): Promise<NormalizedContact[]> {
    try {
      console.log('🔒 [contactsService] Vérification de la permission...');
      const { status } = await Contacts.requestPermissionsAsync();
      console.log('🔒 [contactsService] Permission status:', status);
      
      if (status !== 'granted') {
        console.warn('🚫 [contactsService] Permission denied for contacts');
        throw new Error('Permission denied');
      }

      console.log('📖 [contactsService] Reading contacts from device...');
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      });
      console.log('📚 [contactsService] Raw contacts found:', data.length);

      if (data.length > 0) {
        const normalized = this.normalizeContacts(data);
        console.log('📱 [contactsService] Local contacts fetched:', normalized.length);
        return normalized;
      }
      
      console.warn('⚠️ [contactsService] Aucun contact trouvé');
      return [];
    } catch (error) {
      console.error('❌ [contactsService] Error fetching contacts:', error);
      throw error;
    }
  }

  /**
   * Normalize contacts data and phone numbers to E.164 format (+33...)
   */
  private normalizeContacts(contacts: Contacts.Contact[]): NormalizedContact[] {
    const normalizedContacts: NormalizedContact[] = [];

    contacts.forEach(contact => {
      if (!contact.phoneNumbers || contact.phoneNumbers.length === 0) return;

      const validPhoneNumbers = contact.phoneNumbers
        .map(phone => this.formatPhoneNumber(phone.number))
        .filter((phone): phone is string => !!phone); // Remove nulls

      if (validPhoneNumbers.length > 0) {
        // Remove duplicates within the same contact
        const uniquePhones = [...new Set(validPhoneNumbers)];
        
        normalizedContacts.push({
          id: contact.id || Math.random().toString(),
          name: contact.name || 'Inconnu',
          phoneNumbers: uniquePhones
        });
      }
    });

    return normalizedContacts;
  }

  /**
   * Format phone number to E.164 (+33 for France)
   * This is a simplified version, mainly handling French numbers
   */
  public formatPhoneNumber(phone?: string): string | null {
    if (!phone) return null;

    // Remove all non-numeric characters except +
    let cleaned = phone.replace(/[^0-9+]/g, '');

    // Si le numéro est vide après nettoyage, on retourne null
    if (!cleaned || cleaned.length === 0) return null;

    // Handle French numbers starting with 0
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      return '+33' + cleaned.substring(1);
    }

    // specific case for numbers that might be saved as 336... without +
    if (cleaned.startsWith('33') && cleaned.length === 11 && !cleaned.startsWith('+')) {
      return '+' + cleaned;
    }

    // If it starts with +, assume it's international format
    if (cleaned.startsWith('+')) {
      // Vérifier que c'est un numéro valide (au moins 7 chiffres après le +)
      const digitsAfterPlus = cleaned.substring(1).replace(/[^0-9]/g, '');
      if (digitsAfterPlus.length >= 7 && digitsAfterPlus.length <= 15) {
        return cleaned;
      }
    }
    
    // Si le numéro fait entre 7 et 15 chiffres et commence par un chiffre, 
    // on le garde tel quel (peut être un numéro local ou international sans +)
    const digitsOnly = cleaned.replace(/[^0-9]/g, '');
    if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
      // Pour les numéros français sans indicatif, on assume +33
      if (digitsOnly.length === 10 && digitsOnly.startsWith('0')) {
        return '+33' + digitsOnly.substring(1);
      }
      // Sinon, on retourne le numéro nettoyé (sera normalisé côté API si nécessaire)
      return '+' + digitsOnly;
    }
    
    // Si on ne peut pas déterminer le format, on retourne null
    return null; 
  }
}

export const contactsService = new ContactsService();
