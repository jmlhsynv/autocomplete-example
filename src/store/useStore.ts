import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { Suggestion, FormulaState } from "../types";
import { getSuggestions, filterSuggestions } from "../services/api";
import { evaluate } from "mathjs";

interface SuggestionState {
  suggestions: Suggestion[];
  filteredSuggestions: Suggestion[];
  isLoading: boolean;
  error: Error | null;
  inputValue: string;
  showSuggestions: boolean;
  notFoundMessage: boolean;

  fetchSuggestions: () => Promise<void>;
  setInputValue: (value: string) => void;
  setShowSuggestions: (show: boolean) => void;
  setNotFoundMessage: (show: boolean) => void;
}

interface FormulaStore extends SuggestionState {
  formula: FormulaState["formula"];
  cursorPosition: number;
  result: any;
  activeDropdown: number | null;
  isEditing: boolean;

  addTag: (tag: Suggestion, position: number) => void;
  addOperand: (operand: string, position: number) => void;
  addNumber: (number: string, position: number) => void;
  removeItem: (position: number) => void;
  setCursor: (position: number) => void;
  calculate: () => void;
  updateTag: (position: number, newValue: number) => void;
  setActiveDropdown: (position: number | null) => void;
  toggleEditing: () => void;
}

const useStore = create<FormulaStore>()(
  devtools(
    (set, get) => ({
      suggestions: [],
      filteredSuggestions: [],
      isLoading: false,
      error: null,
      inputValue: "",
      showSuggestions: false,
      notFoundMessage: false,

      formula: [],
      cursorPosition: 0,
      result: null,
      activeDropdown: null,
      isEditing: true,

      fetchSuggestions: async () => {
        set({ isLoading: true });
        try {
          const suggestions = await getSuggestions();
          set({ suggestions, isLoading: false });
        } catch (error) {
          set({ error: error as Error, isLoading: false });
        }
      },

      setInputValue: (value: string) => {
        set({ inputValue: value });

        const { suggestions } = get();
        if (value) {
          const filtered = filterSuggestions(suggestions, value);
          set({
            filteredSuggestions: filtered,
            showSuggestions: true,
            notFoundMessage: filtered.length === 0 && value.length > 0,
          });
        } else {
          set({
            filteredSuggestions: suggestions,
            showSuggestions: false,
            notFoundMessage: false,
          });
        }
      },

      setShowSuggestions: (show: boolean) => set({ showSuggestions: show }),

      setNotFoundMessage: (show: boolean) => set({ notFoundMessage: show }),

      toggleEditing: () => set((state) => ({ isEditing: !state.isEditing })),

      addTag: (tag: Suggestion, position: number) => {
        const { formula } = get();
        const newFormula = [...formula];
        newFormula.splice(position, 0, { type: "tag", value: tag });

        set({
          formula: newFormula,
          cursorPosition: position + 1,
          inputValue: "",
          showSuggestions: false,
        });
      },

      addOperand: (operand: string, position: number) => {
        const { formula } = get();
        const newFormula = [...formula];
        newFormula.splice(position, 0, { type: "operand", value: operand });

        set({
          formula: newFormula,
          cursorPosition: position + 1,
        });
      },

      addNumber: (number: string, position: number) => {
        const { formula } = get();
        const newFormula = [...formula];

        if (position > 0 && formula[position - 1]?.type === "number") {
          newFormula[position - 1] = {
            type: "number",
            value: formula[position - 1].value + number,
          };
        } else {
          newFormula.splice(position, 0, { type: "number", value: number });
          position++;
        }

        set({
          formula: newFormula,
          cursorPosition: position,
        });
      },

      removeItem: (position: number) => {
        if (position <= 0) return;

        const { formula } = get();
        const newFormula = [...formula];
        newFormula.splice(position - 1, 1);

        set({
          formula: newFormula,
          cursorPosition: position - 1,
        });
      },

      setCursor: (position: number) => set({ cursorPosition: position }),

      calculate: () => {
        const { formula } = get();

        try {
          const formulaString = formula
            .map((item) => {
              if (item.type === "tag") {
                return item.value.value || 0;
              }
              return item.value;
            })
            .join(" ");

          const result = evaluate(formulaString);
          set({ result });
        } catch (error) {
          console.error("Calculation error:", error);
          set({ result: "Error" });
        }
      },

      updateTag: (position: number, newValue: number) => {
        const { formula } = get();
        const newFormula = [...formula];

        if (newFormula[position] && newFormula[position].type === "tag") {
          newFormula[position] = {
            ...newFormula[position],
            value: {
              ...newFormula[position].value,
              value: newValue,
            },
          };
        }

        set({ formula: newFormula });
      },

      setActiveDropdown: (position: number | null) =>
        set({ activeDropdown: position }),
    }),
    { name: "formula-store" }
  )
);

export default useStore;
