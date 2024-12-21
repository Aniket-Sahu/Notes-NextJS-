import { Note } from "@/model/User";

export interface ApiResponse {
  success: boolean;
  message: string;
  notes?: Array<Note>
};