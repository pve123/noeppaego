const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/** 주소에 그대로 쓰는 무작위 id(영문·숫자). 10자면 62^10 ≈ 8×10^17 가지라 맞혀 보기 어렵다. */
export function randomId(length = 10): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}
