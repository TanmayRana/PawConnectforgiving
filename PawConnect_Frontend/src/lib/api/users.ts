/** Users API stub — to be implemented. Admin only for user management. */
import { apiGet, apiPut } from "./client";
export interface User { id: string; email: string; firstName: string; lastName: string; role: "pet_owner" | "veterinarian" | "service_provider" | "admin"; status: "active" | "inactive" | "suspended"; }
export const getUsers = (token: string) => apiGet<User[]>("/users", { token });
export const getUser = (id: string, token: string) => apiGet<User>(`/users/${id}`, { token });
export const updateUserStatus = (id: string, status: User["status"], token: string) => apiPut<User>(`/users/${id}/status`, { status }, { token });
