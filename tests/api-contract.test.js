const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");

const projectRoot = join(__dirname, "..");
const readProjectFile = (relativePath) =>
  readFileSync(join(projectRoot, relativePath), "utf8");

test("el repositorio cliente conserva el contrato de endpoints financieros", () => {
  const repository = readProjectFile(
    "src/features/financeApi/infrastructure/FinanceApiRepository.ts",
  );

  const requiredRoutes = [
    "/health/",
    "/metadata/",
    "/users/",
    "/data/financial/",
    "/data/recommendations/",
    "/data/reminders/",
    "/ai/",
  ];

  for (const route of requiredRoutes) {
    assert.match(repository, new RegExp(route.replaceAll("/", "\\/")));
  }

  for (const capability of ["summary", "analyze", "recommend", "predict", "classify"]) {
    assert.match(repository, new RegExp(`${capability}:`));
  }
});

test("el cliente adjunta el token Firebase y no contiene claves privadas de IA", () => {
  const httpClient = readProjectFile("src/core/network/httpClient.ts");
  const apiClient = readProjectFile("src/core/network/apiClient.ts");
  const nativeFirebase = readProjectFile("src/core/config/firebase.ts");
  const webFirebase = readProjectFile("src/core/config/firebase.web.ts");

  assert.match(httpClient, /getIdToken\(\)/);
  assert.match(httpClient, /Authorization/);
  assert.doesNotMatch(
    `${httpClient}\n${apiClient}\n${nativeFirebase}\n${webFirebase}`,
    /OPENAI_API_KEY|sk-[A-Za-z0-9_-]{10,}/,
  );
});

test("el ejemplo de entorno documenta API y Firebase sin valores reales", () => {
  const envExample = readProjectFile(".env.example");
  const requiredVariables = [
    "EXPO_PUBLIC_API_URL",
    "EXPO_PUBLIC_FIREBASE_API_KEY",
    "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
    "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "EXPO_PUBLIC_FIREBASE_APP_ID",
  ];

  for (const variable of requiredVariables) {
    assert.match(envExample, new RegExp(`^${variable}=`, "m"));
  }

  assert.doesNotMatch(envExample, /AIza[0-9A-Za-z_-]{20,}|sk-[A-Za-z0-9_-]{10,}/);
});