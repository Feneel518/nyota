import { randomBytes } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
async function main() {
  await mkdir(".local", { recursive: true });
  const secret = () => randomBytes(32).toString("hex");
  let password: string;
  try {
    password = (await readFile(".local/postgres-password", "utf8")).trim();
  } catch {
    password = secret();
    await writeFile(".local/postgres-password", password);
  }
  try {
    await access(".env.local");
    console.log(".env.local already exists; preserved.");
    return;
  } catch {}
  await writeFile(
    ".env.local",
    `APP_MODE=local\nAPP_URL=http://127.0.0.1:3000\nDATABASE_URL=postgresql://wedding:${password}@127.0.0.1:55432/wedding\nDATABASE_URL_UNPOOLED=postgresql://wedding:${password}@127.0.0.1:55432/wedding\nBETTER_AUTH_SECRET=${secret()}\nHASH_SECRET=${secret()}\nCRON_SECRET=${secret()}\nEMAIL_ADAPTER=local\nSTORAGE_ADAPTER=local\nPAYMENT_ADAPTER=local\nPRICE_PAISE=199900\n`,
  );
  console.log(
    "Local settings created. Start pnpm db:local, then run pnpm db:migrate and pnpm dev. Sign-in emails are in .local/mail.",
  );
}
main().catch(() => {
  console.error("Local setup failed.");
  process.exit(1);
});
