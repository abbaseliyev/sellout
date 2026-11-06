import { useMutation } from "@tanstack/react-query";
import { login } from "../auth.js";

export function useLogin() {
  return useMutation({
    mutationFn: login,
  });
}
