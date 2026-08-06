import * as Contacts from 'expo-contacts';
import { ENV } from '../../config/env';

export interface Contact {
  id: string;
  name: string;
  phoneNumbers?: Contacts.PhoneNumber[];
  imageAvailable?: boolean;
  image?: Contacts.Image;
}

export interface SueUserFromContact {
  phoneNumber: string;
  isRegistered: boolean;
  user?: {
    id: string;
    firstname: string;
    lastname: string;
    avatar?: string;
    relationship?: {
      isFriend: boolean;
      hasPendingRequest: boolean;
    };
  };
}

// Mock registered users for development
const MOCK_REGISTERED_USERS: SueUserFromContact[] = [
  {
    phoneNumber: '+33612345678',
    isRegistered: true,
    user: {
      id: 'mock-user-1',
      firstname: 'Thomas',
      lastname: 'Anderson',
      relationship: {
        isFriend: false,
        hasPendingRequest: false,
      },
    },
  },
  {
    phoneNumber: '0687654321',
    isRegistered: true,
    user: {
      id: 'mock-user-2',
      firstname: 'Sarah',
      lastname: 'Connor',
      relationship: {
        isFriend: true,
        hasPendingRequest: false,
      },
    },
  },
];

export const contactsService = {
  /**
   * Vérifie le statut de la permission contacts
   */
  checkContactsPermission: async (): Promise<{ status: string; canAskAgain: boolean }> => {
    try {
      const { status, canAskAgain } = await Contacts.getPermissionsAsync();
      return { status, canAskAgain: canAskAgain ?? true };
    } catch (error) {
      console.error('Error checking contacts permission:', error);
      return { status: 'undetermined', canAskAgain: true };
    }
  },

  /**
   * Demande la permission contacts
   */
  requestContactsPermission: async (): Promise<{ status: string; granted: boolean }> => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      return { status, granted: status === 'granted' };
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
      return { status: 'denied', granted: false };
    }
  },

  /**
   * Demande la permission et récupère les contacts du téléphone
   */
  getPhoneContacts: async (): Promise<Contact[]> => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status !== 'granted') {
         return [];
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Image],
        sort: Contacts.SortTypes.FirstName,
      });

      // Filtrer les contacts qui ont au moins un numéro de téléphone et un ID
      return data
        .filter(contact => contact.phoneNumbers && contact.phoneNumbers.length > 0 && contact.id)
        .map(contact => ({
          ...contact,
          id: contact.id || '', // Ensure id is string
        }));
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return [];
    }
  },

  /**
   * Vérifie quels contacts sont inscrits sur SUE
   * (Pour l'instant mocké, à connecter au backend plus tard)
   */
  checkContactsOnSue: async (contacts: Contact[]): Promise<SueUserFromContact[]> => {
    if (ENV.USE_MOCKS) {
        // Simulation d'un délai réseau
        await new Promise(resolve => setTimeout(resolve, 800));
        return MOCK_REGISTERED_USERS;
    }

    // TODO: Implémenter l'appel API réel
    // const phoneNumbers = contacts.flatMap(c => c.phoneNumbers?.map(p => p.number) || []);
    // const response = await api.post('/users/check-contacts', { phoneNumbers });
    // return response.data;
    
    return [];
  }
};
