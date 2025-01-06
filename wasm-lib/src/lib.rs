use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn evaluate(expression: &str) -> Result<f64, JsValue> {
    let tokens = tokenize(expression)?;
    evaluate_expression(&tokens).map_err(|e| JsValue::from_str(&e))
}

#[derive(Debug, Clone)]
enum Token {
    Number(f64),
    Plus,
    Minus,
    Multiply,
    Divide,
    LeftParen,
    RightParen,
}

fn tokenize(input: &str) -> Result<Vec<Token>, String> {
    let mut tokens = Vec::new();
    let mut chars = input.chars().peekable();

    while let Some(&ch) = chars.peek() {
        match ch {
            '0'..='9' | '.' => {
                let mut num = String::new();
                while let Some(&ch) = chars.peek() {
                    if ch.is_digit(10) || ch == '.' {
                        num.push(ch);
                        chars.next();
                    } else {
                        break;
                    }
                }
                let number = num.parse::<f64>()
                    .map_err(|_| "Invalid number".to_string())?;
                tokens.push(Token::Number(number));
            }
            '+' => {
                tokens.push(Token::Plus);
                chars.next();
            }
            '-' => {
                tokens.push(Token::Minus);
                chars.next();
            }
            '*' => {
                tokens.push(Token::Multiply);
                chars.next();
            }
            '/' => {
                tokens.push(Token::Divide);
                chars.next();
            }
            '(' => {
                tokens.push(Token::LeftParen);
                chars.next();
            }
            ')' => {
                tokens.push(Token::RightParen);
                chars.next();
            }
            ' ' => {
                chars.next();
            }
            _ => return Err(format!("Unexpected character: {}", ch)),
        }
    }
    Ok(tokens)
}

fn evaluate_expression(tokens: &[Token]) -> Result<f64, String> {
    let mut numbers = Vec::new();
    let mut operators = Vec::new();

    for token in tokens {
        match token {
            Token::Number(n) => numbers.push(*n),
            Token::Plus | Token::Minus | Token::Multiply | Token::Divide => {
                while let Some(op) = operators.last() {
                    if precedence(token) <= precedence(op) {
                        apply_operator(&mut numbers, operators.pop().unwrap())?;
                    } else {
                        break;
                    }
                }
                operators.push(token.clone());
            }
            Token::LeftParen => operators.push(token.clone()),
            Token::RightParen => {
                while let Some(op) = operators.last() {
                    if matches!(op, Token::LeftParen) {
                        operators.pop();
                        break;
                    }
                    apply_operator(&mut numbers, operators.pop().unwrap())?;
                }
            }
        }
    }

    while let Some(op) = operators.pop() {
        apply_operator(&mut numbers, op)?;
    }

    numbers.pop().ok_or_else(|| "Invalid expression".to_string())
}

fn precedence(token: &Token) -> i32 {
    match token {
        Token::Plus | Token::Minus => 1,
        Token::Multiply | Token::Divide => 2,
        Token::LeftParen => 0,
        _ => 0,
    }
}

fn apply_operator(numbers: &mut Vec<f64>, op: Token) -> Result<(), String> {
    if numbers.len() < 2 {
        return Err("Invalid expression".to_string());
    }

    let b = numbers.pop().unwrap();
    let a = numbers.pop().unwrap();

    let result = match op {
        Token::Plus => a + b,
        Token::Minus => a - b,
        Token::Multiply => a * b,
        Token::Divide => {
            if b == 0.0 {
                return Err("Division by zero".to_string());
            }
            a / b
        }
        _ => return Err("Invalid operator".to_string()),
    };

    numbers.push(result);
    Ok(())
}
