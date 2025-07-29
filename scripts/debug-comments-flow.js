const fetch = require('node-fetch');

// Simulation complète du flux de l'app mobile
async function debugCommentsFlow() {
  
  const API_BASE_URL = 'http://192.168.1.190:8000/api';
  const SESSION_ID = '4e86b99c-b306-4e1b-aefe-27644661c006';
  
  try {
    // 1. Authentification (comme l'app mobile)
    const authResponse = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: 'driciissa76@gmail.com',
        password: 'Asmaa1997!',
        device_name: 'Sue Mobile App'
      })
    });
    
    const authData = await authResponse.json();
    const token = authData.token;
    const user = authData.user;
    
    
    // 2. Récupération des commentaires (comme useGetComments)
    const commentsResponse = await fetch(`${API_BASE_URL}/sessions/${SESSION_ID}/comments`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const commentsData = await commentsResponse.json();
    
    // 3. Simulation de l'adaptation (comme dans getComments.ts)
    
    const commentsArray = commentsData?.data || [];
    
    const adaptedComments = commentsArray.map((comment) => {
      
      return {
        id: comment.id,
        userId: comment.user_id, // snake_case from backend
        sessionId: comment.session_id, // snake_case from backend
        content: comment.content,
        mentions: comment.mentions,
        createdAt: comment.created_at, // snake_case from backend
        updatedAt: comment.updated_at, // snake_case from backend
        user: {
          id: comment.user?.id || comment.user_id,
          firstname: comment.user?.firstname || 'Utilisateur',
          lastname: comment.user?.lastname || comment.user_id,
          avatar: comment.user?.avatar || null
        },
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        fullName: comment.user?.firstname && comment.user?.lastname 
          ? `${comment.user.firstname} ${comment.user.lastname}` 
          : `Utilisateur ${comment.user_id}`
      };
    });
    
    
    // 4. Simulation de l'affichage (comme dans ChatComments.tsx)
    
    if (adaptedComments.length > 0) {
      const firstComment = adaptedComments[0];
      
      // Simulation de CommentItem
      const userName = firstComment.user?.firstname && firstComment.user?.lastname 
        ? `${firstComment.user.firstname} ${firstComment.user.lastname}`
        : firstComment.fullName || 'Utilisateur inconnu';
      
      const timeString = firstComment.created_at || firstComment.createdAt;
      
      
      // Simulation de renderComment
      const isOwnComment = firstComment.user?.id === user?.id || firstComment.userId === user?.id;
    }
    
    // 5. Vérification des propriétés manquantes
    
    const sampleComment = commentsArray[0];
    
  } catch (error) {
  }
}

debugCommentsFlow(); 