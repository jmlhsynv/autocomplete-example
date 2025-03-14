import React, { useRef, useEffect } from "react";
import useStore from "../store/useStore";

const FormulaInput: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    formula,
    cursorPosition,
    result,
    inputValue,
    showSuggestions,
    filteredSuggestions,
    activeDropdown,
    isLoading,
    error,

    fetchSuggestions,
    setInputValue,
    addTag,
    addOperand,
    addNumber,
    setCursor,
    calculate,
    setActiveDropdown,
  } = useStore();

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // check if a character is an operand
  const isOperand = (char: string): boolean => {
    return ["+", "-", "*", "/", "(", ")", "^"].includes(char);
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setInputValue(e.target.value);
  };

  // backspace functionality
  const handleBackspaceKey = (): void => {
    if (inputValue !== "") return;

    if (cursorPosition > 0) {
      const store = useStore.getState();
      const currentFormula = [...store.formula];

      const newFormula = [
        ...currentFormula.slice(0, cursorPosition - 1),
        ...currentFormula.slice(cursorPosition),
      ];

      store.setCursor(cursorPosition - 1);
      useStore.setState({ formula: newFormula });

      setTimeout(() => {
        store.calculate();
      }, 0);
    }
  };

  // handle key press in the input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Backspace" && inputValue === "") {
      e.preventDefault();
      handleBackspaceKey();
    } else if (e.key === "ArrowLeft") {
      if (cursorPosition > 0) {
        setCursor(cursorPosition - 1);
      }
    } else if (e.key === "ArrowRight") {
      if (cursorPosition < formula.length) {
        setCursor(cursorPosition + 1);
      }
    } else if (
      e.key === "Enter" &&
      inputValue &&
      filteredSuggestions.length > 0
    ) {
      e.preventDefault();
      handleSuggestionSelect(filteredSuggestions[0]);
    } else if (e.key === "Enter" && inputValue === "") {
      e.preventDefault();
      calculate();
    } else if (isOperand(e.key) && inputValue === "") {
      e.preventDefault();
      addOperand(e.key, cursorPosition);
      setCursor(cursorPosition + 1);
    } else if (!isNaN(parseInt(e.key)) && inputValue === "") {
      e.preventDefault();
      addNumber(e.key, cursorPosition);
      setCursor(cursorPosition + 1);
    }
  };

  //  selecting a suggestion
  const handleSuggestionSelect = (suggestion: any): void => {
    if (inputValue && !isNaN(parseFloat(inputValue))) {
      const numericValue = parseFloat(inputValue);
      const suggestionWithValue = {
        ...suggestion,
        value: numericValue,
      };
      addTag(suggestionWithValue, cursorPosition);
    } else {
      addTag(suggestion, cursorPosition);
    }

    // clear input and focus
    setInputValue("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // custom function to manually replace tag with new tag
  const customReplaceTag = (position: number, newTag: any): void => {
    const store = useStore.getState();
    const currentFormula = [...store.formula];

    if (
      position >= 0 &&
      position < currentFormula.length &&
      currentFormula[position].type === "tag"
    ) {
      const replacementTag = {
        type: "tag",
        value: {
          ...newTag,
        },
      };

      const newFormula = [...currentFormula];
      // @ts-ignore
      newFormula[position] = replacementTag;

      useStore.setState({ formula: newFormula });

      store.calculate();
    }

    // close dropdown
    store.setActiveDropdown(null);

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="relative border-2 border-gray-300 rounded-lg p-3 bg-gray-50 min-h-12">
        <div className="flex flex-wrap items-center gap-1 min-h-8">
          {formula.map((item, index) => {
            if (item.type === "tag") {
              return (
                <div
                  key={index}
                  className="flex items-center bg-blue-100 border border-blue-300 rounded px-2 py-1 text-sm relative group"
                  onClick={() => setCursor(index + 1)}
                >
                  <span className="mr-1">{item.value.name}</span>
                  {item.value.value !== undefined && (
                    <span className="text-blue-800 font-medium mr-1">
                      ({item.value.value})
                    </span>
                  )}
                  <button
                    className="text-blue-600 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDropdown(
                        activeDropdown === index ? null : index
                      );
                    }}
                  >
                    ▼
                  </button>
                  {activeDropdown === index && (
                    <div className="absolute top-full left-0 bg-white border border-gray-300 rounded shadow-lg z-10 w-64 max-h-48 overflow-y-auto">
                      {filteredSuggestions.length > 0 ? (
                        filteredSuggestions.map((suggestion) => (
                          <div
                            key={suggestion.id}
                            className="p-2 cursor-pointer hover:bg-gray-100 flex justify-between"
                            onClick={(e) => {
                              e.stopPropagation();
                              customReplaceTag(index, suggestion);
                            }}
                          >
                            <span className="font-medium">
                              {suggestion.name}
                            </span>
                            <span className="text-gray-600 text-xs">
                              {suggestion.category}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-gray-500">
                          No suggestions available
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            } else if (item.type === "operand") {
              return (
                <div
                  key={index}
                  className="flex items-center justify-center bg-gray-200 rounded w-6 h-6 font-bold"
                  onClick={() => setCursor(index + 1)}
                >
                  {item.value}
                </div>
              );
            } else if (item.type === "number") {
              return (
                <div
                  key={index}
                  className="flex items-center bg-green-100 border border-green-300 rounded px-2 py-1 text-sm"
                  onClick={() => setCursor(index + 1)}
                >
                  {item.value}
                </div>
              );
            }
            return null;
          })}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="flex-grow border-none bg-transparent outline-none p-0 m-0 text-sm min-w-8"
            placeholder={
              formula.length === 0
                ? "Start typing to add variables or numbers"
                : ""
            }
          />
        </div>

        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute left-0 top-full w-full max-h-48 overflow-y-auto bg-white border border-gray-300 rounded shadow-lg z-10 mt-1">
            {filteredSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="p-2 cursor-pointer hover:bg-gray-100 flex justify-between"
                onClick={() => handleSuggestionSelect(suggestion)}
              >
                <span className="font-medium">{suggestion.name}</span>
                <span className="text-gray-600 text-xs">
                  {suggestion.category}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {isLoading && (
        <div className="mt-4 p-2 bg-blue-100 rounded">
          Loading suggestions...
        </div>
      )}

      {error && (
        <div className="mt-4 p-2 bg-red-100 rounded text-red-700">
          Error loading suggestions. Please try again.
        </div>
      )}

      {result !== null && (
        <div className="mt-4 p-2 bg-green-100 rounded font-medium">
          Result: {result}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-600">
        <p>Type variable name to search, press Enter to select</p>
        <p>Type a number followed by variable name to set its value</p>
        <p>Use +, -, *, /, (, ), ^ for operations</p>
        <p>Press Enter to calculate result</p>
        <p>Press Backspace to remove items one by one at cursor position</p>
        <p>Click on dropdown button (▼) to replace tag or adjust its value</p>
      </div>
    </div>
  );
};

export default FormulaInput;
