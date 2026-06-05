// Test passwords that survive the backend zxcvbn strength gate
// (MIN_PASSWORD_SCORE = 3).
//
// `faker.internet.password()` returns random strings that *usually* score
// >=3 but can occasionally collide with a common pattern

// Deterministic, high-entropy. Mix of upper/lower/digit/symbol with a
// non-dictionary token; zxcvbn consistently scores this at 4.
export const STRONG_TEST_PASSWORD = 'T@ilor-Forge!8421';

// Comfortably below the score-3 floor (zxcvbn flags it as a common
// password variant). Used by negative specs that assert the gate fires.
export const WEAK_TEST_PASSWORD = 'password123';
