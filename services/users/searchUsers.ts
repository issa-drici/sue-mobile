import { useCallback, useState } from "react";
import { ENV } from "../../config/env";
import { mockUsers } from "../../mocks/users";
import { UsersApi } from "../api/usersApi";
import { SearchUserResult } from "../types/users";

export function useSearchUsers() {
  const [data, setData] = useState<SearchUserResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setData([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (ENV.USE_MOCKS) {
        // Filtrer les utilisateurs mock selon la requête
        const filteredUsers = mockUsers.filter(
          (user) =>
            user.firstname.toLowerCase().includes(query.toLowerCase()) ||
            user.lastname.toLowerCase().includes(query.toLowerCase()) ||
            user.email.toLowerCase().includes(query.toLowerCase())
        );

        const mockResults: SearchUserResult[] = filteredUsers.map((user) => ({
          id: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
          avatar: user.avatar,
          email: user.email,
          isFriend: false,
          hasPendingRequest: false,
        }));

        setData(mockResults);
      } else {
        const response = await UsersApi.searchUsers(query);

        // Adapter la réponse selon la structure réelle de l'API
        // L'API retourne: { success: true, data: [...] }
        let searchResults: SearchUserResult[] = [];

        if (response && typeof response === "object") {
          const responseObj = response as any;

          // Structure avec success, data et pagination (structure actuelle)
          if (
            responseObj.success &&
            responseObj.data &&
            Array.isArray(responseObj.data)
          ) {
            searchResults = responseObj.data.map((user: any) => ({
              id: user.id,
              firstname: user.firstname || user.firstname || "",
              lastname: user.lastname || user.lastname || "",
              email: user.email,
              avatar: user.avatar,
              isFriend: user.relationship?.isFriend || false,
              hasPendingRequest: user.relationship?.hasPendingRequest || false,
              mutualFriends: user.relationship?.mutualFriends || 0,
              relationshipStatus: user.relationship?.status || "none",
            }));
          }
          // Si c'est directement un tableau (fallback)
          else if (Array.isArray(response)) {
            searchResults = response.map((user: any) => ({
              id: user.id,
              firstname: user.firstname || user.firstname || "",
              lastname: user.lastname || user.lastname || "",
              email: user.email,
              avatar: user.avatar,
              isFriend: user.relationship?.isFriend || user.isFriend || false,
              hasPendingRequest:
                user.relationship?.hasPendingRequest ||
                user.hasPendingRequest ||
                false,
              mutualFriends:
                user.relationship?.mutualFriends || user.mutualFriends || 0,
              relationshipStatus: user.relationship?.status || "none",
            }));
          }
          // Ancienne structure (fallback)
          else if (responseObj.data && Array.isArray(responseObj.data)) {
            searchResults = responseObj.data.map((user: any) => {
              const fullName = user.full_name || "";
              const nameParts = fullName.split(" ");
              const firstname = nameParts[0] || "";
              const lastname = nameParts.slice(1).join(" ") || "";

              return {
                id: user.id,
                firstname: firstname,
                lastname: lastname,
                email: user.email,
                avatar: user.avatar,
                isFriend: user.isFriend || false,
                hasPendingRequest: user.hasPendingRequest || false,
              };
            });
          }
          // Si c'est un objet unique (fallback)
          else if (
            responseObj.id &&
            (responseObj.firstname || responseObj.firstname)
          ) {
            searchResults = [
              {
                id: responseObj.id,
                firstname: responseObj.firstname || responseObj.firstname || "",
                lastname: responseObj.lastname || responseObj.lastname || "",
                email: responseObj.email,
                avatar: responseObj.avatar,
                isFriend: responseObj.isFriend || false,
                hasPendingRequest: responseObj.hasPendingRequest || false,
                mutualFriends: responseObj.mutualFriends || 0,
              },
            ];
          }
        }

        setData(searchResults);
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors de la recherche d'utilisateurs");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    data,
    isLoading,
    error,
    searchUsers,
  };
}
