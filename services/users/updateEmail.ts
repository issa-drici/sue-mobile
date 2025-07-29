import { useState } from "react";
import { ENV } from "../../config/env";
import { UsersApi } from "../api/usersApi";

export function useUpdateEmail() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const updateEmail = async (newEmail: string, currentEmail: string) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      if (ENV.USE_MOCKS) {
        await new Promise((res) => setTimeout(res, 500));
        setSuccess(true);
      } else {
        await UsersApi.updateEmail(newEmail, currentEmail);
        setSuccess(true);
      }
    } catch (e: any) {
      setError(e.message || "Erreur lors de la mise à jour de l'email");
    } finally {
      setIsLoading(false);
    }
  };

  return { updateEmail, isLoading, error, success };
}
