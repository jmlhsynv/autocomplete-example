export interface Suggestion {
  id: string;
  name: string;
  category: string;
  value?: number;
}

export type FormulaItem =
  | { type: "tag"; value: Suggestion }
  | { type: "operand"; value: string }
  | { type: "number"; value: string };

export interface FormulaState {
  formula: FormulaItem[];
  cursorPosition: number;
  result: any;
}

export type FormulaAction =
  | { type: "ADD_TAG"; tag: Suggestion; position: number }
  | { type: "ADD_OPERAND"; operand: string; position: number }
  | { type: "ADD_NUMBER"; number: string; position: number }
  | { type: "REMOVE_ITEM"; position: number }
  | { type: "SET_CURSOR"; position: number }
  | { type: "CALCULATE" }
  | { type: "UPDATE_TAG"; position: number; newValue: number };
