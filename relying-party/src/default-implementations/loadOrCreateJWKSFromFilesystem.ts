import * as fs from "fs";
import { fileExists, generateJWKS } from "../utils";

export async function loadOrCreateJWKSFromFilesystem() {
  const public_jwks_path = "./public.jwks.json";
  const private_jwks_path = "./private.jwks.json";

  if ((await fileExists(public_jwks_path)) && (await fileExists(private_jwks_path))) {
    const public_jwks = JSON.parse(await fs.promises.readFile(public_jwks_path, "utf8"));
    const private_jwks = JSON.parse(await fs.promises.readFile(private_jwks_path, "utf8"));
    return { public_jwks, private_jwks };
  } else {
    const { public_jwks, private_jwks } = await generateJWKS();
    await fs.promises.writeFile(public_jwks_path, JSON.stringify(public_jwks));
    await fs.promises.writeFile(private_jwks_path, JSON.stringify(private_jwks));
    return { public_jwks, private_jwks };
  }
}
