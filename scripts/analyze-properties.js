/**
 * Analyse des propriétés utilisées dans le frontend
 * 
 * Ce script identifie les incohérences entre les propriétés
 * utilisées dans le code et celles retournées par l'API.
 */


// Propriétés retournées par l'API (d'après le test backend)
const apiProperties = {
  user: {
    id: "string",
    firstname: "string", // ✅ API utilise firstname (minuscules)
    lastname: "string",  // ✅ API utilise lastname (minuscules)
    email: "string",
    avatar: "string|null",
    stats: "array"
  },
  friend: {
    id: "string",
    firstname: "string", // ✅ API utilise firstname (minuscules)
    lastname: "string",  // ✅ API utilise lastname (minuscules)
    avatar: "string|null",
    status: "string"
  },
  friendRequest: {
    id: "string",
    firstname: "string", // ❓ À vérifier
    lastname: "string",  // ❓ À vérifier
    avatar: "string",
    mutualFriends: "number"
  }
};

// Propriétés utilisées dans le frontend (d'après l'analyse du code)
const frontendProperties = {
  profile: {
    userProfile: {
      firstname: "✅ Utilisé correctement",
      lastname: "✅ Utilisé correctement",
      email: "✅ Utilisé correctement"
    },
    user: {
      firstname: "✅ Utilisé correctement",
      lastname: "✅ Utilisé correctement",
      email: "✅ Utilisé correctement"
    }
  },
  friends: {
    friend: {
      firstname: "✅ Utilisé correctement",
      lastname: "✅ Utilisé correctement"
    },
    friendRequest: {
      // ❌ Mélange de propriétés
      sender: {
        firstname: "✅ Utilisé",
        lastname: "✅ Utilisé"
      },
      fromUser: {
        firstname: "❌ Incohérent (camelCase)",
        lastname: "❌ Incohérent (camelCase)"
      },
      firstname: "❌ Incohérent (camelCase)",
      lastname: "❌ Incohérent (camelCase)"
    }
  }
};

// Types TypeScript (d'après types/user.ts)
const typescriptTypes = {
  User: {
    firstname: "✅ Correct (minuscules)",
    lastname: "✅ Correct (minuscules)"
  },
  Friend: {
    firstname: "✅ Correct (minuscules)",
    lastname: "✅ Correct (minuscules)"
  },
  FriendRequest: {
    firstname: "❌ Incohérent (camelCase)",
    lastname: "❌ Incohérent (camelCase)"
  }
};





