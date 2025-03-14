import axios from "axios";
import { Suggestion } from "../types";

// axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// fetch all suggestions
export const getSuggestions = async (): Promise<Suggestion[]> => {
  try {
    const response = await api.get<Suggestion[]>("/autocomplete");
    return response.data;
  } catch (error) {
    console.error("Error fetching suggestions:", error);

    return [];
  }
};

export const filterSuggestions = (
  suggestions: Suggestion[],
  query: string
): Suggestion[] => {
  if (!query) return suggestions;

  return suggestions.filter(
    (item) =>
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );
};
