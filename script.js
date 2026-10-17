
const expressionDisplay = document.getElementById("expression");
const resultDisplay = document.getElementById("result");
const keypad = document.getElementById("keypad");

let expression = "";
let justCalculated = false;

function updateDisplay(message = "") {
  expressionDisplay.textContent = message ||
    expression.replace(/\*/g, " × ").replace(/\//g, " ÷ ") ||
    "Ready to calculate";

  resultDisplay.textContent = expression || "0";
}

function showError(message) {
  expressionDisplay.textContent = message;
  resultDisplay.textContent = "Error";
}

// Safe arithmetic parser with operator precedence
function calculate(input) {
  const tokens = input.match(
    /(?:\d+\.?\d*|\.\d+)|[+\-*/()]/g
  );

  if (!tokens || tokens.join("") !== input.replace(/\s/g, "")) {
    throw new Error("Invalid expression");
  }

  let position = 0;

  function parseExpression() {
    let value = parseTerm();

    while (tokens[position] === "+" ||
           tokens[position] === "-") {
      const operator = tokens[position++];
      const right = parseTerm();

      value = operator === "+"
        ? value + right
        : value - right;
    }

    return value;
  }

  function parseTerm() {
    let value = parseFactor();

    while (tokens[position] === "*" ||
           tokens[position] === "/") {
      const operator = tokens[position++];
      const right = parseFactor();

      if (operator === "/" && right === 0) {
        throw new Error("Cannot divide by zero");
      }

      value = operator === "*"
        ? value * right
        : value / right;
    }

    return value;
  }

  function parseFactor() {
    const token = tokens[position];

    if (token === "+") {
      position++;
      return parseFactor();
    }

    if (token === "-") {
      position++;
      return -parseFactor();
    }

    if (token === "(") {
      position++;
      const value = parseExpression();

      if (tokens[position] !== ")") {
        throw new Error("Missing closing bracket");
      }

      position++;
      return value;
    }

    if (!token || !/^(?:\d+\.?\d*|\.\d+)$/.test(token)) {
      throw new Error("Invalid number");
    }

    position++;
    return Number(token);
  }

  const answer = parseExpression();

  if (position !== tokens.length || !Number.isFinite(answer)) {
    throw new Error("Invalid calculation");
  }

  return Number(answer.toPrecision(12));
}

function appendValue(value) {
  if (justCalculated) {
    if (/[0-9.]/.test(value)) {
      expression = "";
    }
    justCalculated = false;
  }

  if (/[0-9.]/.test(value)) {
    const currentNumber = expression.split(/[+\-*/]/).pop();

    if (value === "." && currentNumber.includes(".")) {
      return;
    }

    if (value === "." &&
        (!currentNumber || /[+\-*/]$/.test(expression))) {
      expression += "0";
    }

    expression += value;
  } else {
    if (!expression && value !== "-") return;

    if (/[+\-*/]$/.test(expression)) {
      expression = expression.slice(0, -1);
    }

    expression += value;
  }

  updateDisplay();
}

function clearCalculator() {
  expression = "";
  justCalculated = false;
  updateDisplay();
}

function deleteLast() {
  if (justCalculated) {
    clearCalculator();
    return;
  }

  expression = expression.slice(0, -1);
  updateDisplay();
}

function applyPercent() {
  if (!expression || justCalculated) {
    if (!expression) return;
  }

  const match = expression.match(/(\d+\.?\d*|\.\d+)$/);

  if (!match) return;

  const number = Number(match[0]) / 100;
  expression = expression.slice(0, -match[0].length) +
    String(number);

  justCalculated = false;
  updateDisplay();
}

function toggleSign() {
  if (!expression) {
    expression = "-";
    updateDisplay();
    return;
  }

  if (justCalculated) {
    expression = String(-Number(expression));
    justCalculated = false;
    updateDisplay();
    return;
  }

  const match = expression.match(/(\d+\.?\d*|\.\d+)$/);

  if (!match) return;

  const start = match.index;
  const before = expression.slice(0, start);
  const number = match[0];

  if (before.endsWith("-") &&
      (before.length === 1 || /[+*/(]/.test(before.at(-2)))) {
    expression = before.slice(0, -1) + number;
  } else {
    expression = before + "(-" + number + ")";
  }

  updateDisplay();
}

function showResult() {
  if (!expression) return;

  try {
    const answer = calculate(expression);
    expressionDisplay.textContent = expression.replace(/\*/g, " × ")
      .replace(/\//g, " ÷ ");

    expression = String(answer);
    resultDisplay.textContent = expression;
    justCalculated = true;
  } catch (error) {
    showError(error.message);
    justCalculated = true;
  }
}

// Mouse and touch buttons
keypad.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.value !== undefined) {
    appendValue(button.dataset.value);
    return;
  }

  switch (button.dataset.action) {
    case "clear":
      clearCalculator();
      break;
    case "delete":
      deleteLast();
      break;
    case "percent":
      applyPercent();
      break;
    case "sign":
      toggleSign();
      break;
    case "equals":
      showResult();
      break;
  }
});

// Keyboard support
document.addEventListener("keydown", (event) => {
  const key = event.key;

  if (/^[0-9.]$/.test(key)) {
    appendValue(key);
  } else if (["+", "-", "*", "/"].includes(key)) {
    appendValue(key);
  } else if (key === "Enter" || key === "=") {
    event.preventDefault();
    showResult();
  } else if (key === "Backspace") {
    deleteLast();
  } else if (key === "Escape") {
    clearCalculator();
  } else if (key === "%") {
    applyPercent();
  }
});

updateDisplay();