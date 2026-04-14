/**
 * Script de deploy web para producao.
 *
 * O que faz:
 * 1. Gera o bundle estatico em dist/ via Expo export
 * 2. Recria o vinculo com o projeto sigma-reserva no Vercel
 *    (o build apaga dist/ e perde o .vercel/project.json a cada execucao)
 * 3. Faz o deploy para https://sigma-reserva.vercel.app
 *
 * Uso:
 *   npm run deploy:web
 */

import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");

const VERCEL_PROJECT = {
  projectId: "prj_tNCxxi2y6r2ZSMULBX14PH2BObQG",
  orgId: "team_gBFVEuvLRV03MKKi7kTiDrCk",
  projectName: "sigma-reserva",
};

console.log("=== Deploy web — Sigma Reserva ===\n");

// 1. Build
console.log("1. Gerando bundle web...");
execSync("npx expo export --platform web", { stdio: "inherit", cwd: rootDir });

// 2. Recriar vinculo com o projeto Vercel correto
console.log("\n2. Vinculando ao projeto sigma-reserva no Vercel...");
const vercelDir = path.join(distDir, ".vercel");
mkdirSync(vercelDir, { recursive: true });
writeFileSync(path.join(vercelDir, "project.json"), JSON.stringify(VERCEL_PROJECT, null, 2));
console.log("   Vinculo criado: sigma-reserva");

// 3. Deploy
console.log("\n3. Fazendo deploy para producao...");
execSync("npx vercel --prod --yes", { stdio: "inherit", cwd: distDir });

console.log("\n=== Deploy concluido ===");
console.log("URL: https://sigma-reserva.vercel.app");
