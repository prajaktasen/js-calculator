const display = document.getElementById("display");

let expression = "";      // what the user has typed, e.g. "10+26*33" (shown with x for multiply)
let justEvaluated = false; // true right after pressing "="

const OPERATORS = ["+", "-", "x", "/"];

// Display
function updateDisplay() {
  display.textContent = expression === "" ? "0" : expression;
}

// Input handling
function pressDigit(d) {
  if (justEvaluated) {
    expression = "";
    justEvaluated = false;
  }
  expression += d;
  updateDisplay();
}

function pressOperator(op) {
  if (expression === "Error") expression = "";
  justEvaluated = false;

  if (expression === "") {
    // Only a leading minus is allowed (negative number)
    if (op === "-") expression = "-";
    updateDisplay();
    return;
  }

  const last = expression[expression.length - 1];
  if (OPERATORS.includes(last)) {
    // Don't allow an operator right after a lone leading "-"
    if (expression === "-") return;
    // Replace the previous operator
    expression = expression.slice(0, -1) + op;
  } else {
    expression += op;
  }
  updateDisplay();
}

function clearAll() {
  expression = "";
  justEvaluated = false;
  updateDisplay();
}

function pressEquals() {
  if (expression === "" || expression === "Error") return;

  // Drop a trailing operator
  let expr = expression;
  while (expr.length && OPERATORS.includes(expr[expr.length - 1])) {
    expr = expr.slice(0, -1);
  }
  if (expr === "" || expr === "-") return;

  const result = evaluate(expr);
  if (result === null || !isFinite(result)) {
    expression = "Error";
  } else {
    // Trim floating point noise (0.1 + 0.2 -> 0.3)
    expression = String(parseFloat(result.toPrecision(12)));
  }
  justEvaluated = true;
  updateDisplay();
}

// Evaluation
// Tokenize the string into numbers and operators.
function tokenize(str) {
  const tokens = [];
  let i = 0;

  while (i < str.length) {
    const ch = str[i];
    const prev = tokens[tokens.length - 1];
    const isUnaryMinus =
      ch === "-" && (tokens.length === 0 || OPERATORS.includes(prev));

    if ((ch >= "0" && ch <= "9") || ch === "." || isUnaryMinus) {
      let num = ch;
      i++;
      while (i < str.length && ((str[i] >= "0" && str[i] <= "9") || str[i] === ".")) {
        num += str[i];
        i++;
      }
      const value = parseFloat(num);
      if (isNaN(value)) return null;
      tokens.push(value);
    } else if (OPERATORS.includes(ch)) {
      tokens.push(ch);
      i++;
    } else {
      return null;
    }
  }
  return tokens;
}

const PRECEDENCE = { "+": 1, "-": 1, "x": 2, "/": 2 };

function applyOp(op, a, b) {
  switch (op) {
    case "+": return a + b;
    case "-": return a - b;
    case "x": return a * b;
    case "/": return b === 0 ? NaN : a / b;
  }
}

// Evaluate using two stacks so that multiplication/division
// happen before addition/subtraction.
function evaluate(str) {
  const tokens = tokenize(str);
  if (!tokens || tokens.length === 0) return null;

  const values = [];
  const ops = [];

  function reduce() {
    const op = ops.pop();
    const b = values.pop();
    const a = values.pop();
    values.push(applyOp(op, a, b));
  }

  for (const token of tokens) {
    if (typeof token === "number") {
      values.push(token);
    } else {
      while (ops.length && PRECEDENCE[ops[ops.length - 1]] >= PRECEDENCE[token]) {
        reduce();
      }
      ops.push(token);
    }
  }
  while (ops.length) reduce();

  return values.length === 1 ? values[0] : null;
}

// Wire up buttons
document.querySelectorAll(".num").forEach((btn) => {
  btn.addEventListener("click", () => pressDigit(btn.dataset.value));
});

document.querySelectorAll(".op[data-value]").forEach((btn) => {
  btn.addEventListener("click", () => pressOperator(btn.dataset.value));
});

document.getElementById("equals").addEventListener("click", pressEquals);
document.getElementById("clear").addEventListener("click", clearAll);

// Keyboard support (bonus)
document.addEventListener("keydown", (e) => {
  if (e.key >= "0" && e.key <= "9") pressDigit(e.key);
  else if (e.key === "+" || e.key === "-" || e.key === "/") pressOperator(e.key);
  else if (e.key === "*" || e.key === "x") pressOperator("x");
  else if (e.key === "Enter" || e.key === "=") { e.preventDefault(); pressEquals(); }
  else if (e.key === "Escape" || e.key === "c" || e.key === "C") clearAll();
  else if (e.key === "Backspace") {
    if (!justEvaluated && expression !== "Error") {
      expression = expression.slice(0, -1);
      updateDisplay();
    }
  }
});

updateDisplay();