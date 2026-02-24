import { hash, verify } from "@node-rs/argon2";

const ARGON_OPTIONS = {
  // Argon2id = 2 (@node-rs/argon2 exports const enums, problematic with isolatedModules)
  algorithm: 2,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
} as const;

export async function hashPassword(password: string) {
  return hash(password, ARGON_OPTIONS);
}

export async function verifyPasswordHash(passwordHash: string, password: string) {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}
