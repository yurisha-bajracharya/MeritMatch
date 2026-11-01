import { promises as fs } from "fs";
import path from "path";
import type { Db } from "./types";

const FILE = path.join(process.cwd(), "data", "store.json");
const empty = (): Db => ({ jobs: [], candidates: [], submissions: [] });

let queue: Promise<unknown> = Promise.resolve();

async function read(): Promise<Db> {
  try {
    return { ...empty(), ...JSON.parse(await fs.readFile(FILE, "utf8")) };
  } catch {
    return empty();
  }
}

export function readDb(): Promise<Db> {
  return read();
}

/** Runs the mutation serially so concurrent requests don't clobber the file. */
export function updateDb<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const db = await read();
    const result = await fn(db);
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(db, null, 2));
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

export const newId = () => crypto.randomUUID().slice(0, 8);
