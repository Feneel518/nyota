import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { mkdir, readFile, writeFile, unlink, stat } from "node:fs/promises";
import path from "node:path";
import { env, localOnly } from "./env";
function client() {
  const e = env();
  return new S3Client({
    endpoint: e.S3_ENDPOINT,
    region: e.S3_REGION,
    credentials: {
      accessKeyId: e.S3_ACCESS_KEY_ID!,
      secretAccessKey: e.S3_SECRET_ACCESS_KEY!,
    },
  });
}
function file(key: string) {
  if (!/^[a-zA-Z0-9/_-]+\.[a-z]+$/.test(key) || key.includes(".."))
    throw new Error("Invalid storage key");
  return path.resolve(".local/objects", key);
}
export async function readObject(key: string, max = 12 * 1024 * 1024) {
  if (env().STORAGE_ADAPTER === "local") {
    localOnly();
    const p = file(key);
    if ((await stat(p)).size > max) throw new Error("Object too large");
    return readFile(p);
  }
  const result = await client().send(
    new GetObjectCommand({ Bucket: env().S3_BUCKET, Key: key }),
  );
  if (!result.Body || (result.ContentLength || 0) > max)
    throw new Error("Object too large or absent");
  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of result.Body as AsyncIterable<Uint8Array>) {
    size += chunk.length;
    if (size > max) throw new Error("Object too large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
export async function writeObject(key: string, data: Buffer, type: string) {
  if (env().STORAGE_ADAPTER === "local") {
    localOnly();
    const p = file(key);
    await mkdir(path.dirname(p), { recursive: true });
    await writeFile(p, data);
    return;
  }
  await client().send(
    new PutObjectCommand({
      Bucket: env().S3_BUCKET,
      Key: key,
      Body: data,
      ContentType: type,
    }),
  );
}
export async function objectSize(key: string) {
  if (env().STORAGE_ADAPTER === "local") {
    localOnly();
    return (await stat(file(key))).size;
  }
  return (
    (
      await client().send(
        new HeadObjectCommand({ Bucket: env().S3_BUCKET, Key: key }),
      )
    ).ContentLength || 0
  );
}
export async function deleteObject(key: string) {
  if (env().STORAGE_ADAPTER === "local") {
    localOnly();
    await unlink(file(key)).catch((e: NodeJS.ErrnoException) => {
      if (e.code !== "ENOENT") throw e;
    });
    return;
  }
  await client().send(
    new DeleteObjectCommand({ Bucket: env().S3_BUCKET, Key: key }),
  );
}
export async function signedUpload(key: string, type: string) {
  return getSignedUrl(
    client(),
    new PutObjectCommand({
      Bucket: env().S3_BUCKET,
      Key: key,
      ContentType: type,
    }),
    { expiresIn: 300 },
  );
}
