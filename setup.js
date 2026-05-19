const fs = require("fs");
const path = require("path");

const projectRoot = process.env.INIT_CWD ?? process.cwd();
const pkgPath = path.join(projectRoot, "package.json");
const isInit = process.argv.includes("--init");

if (!fs.existsSync(pkgPath)) {
  console.log("rbxts-genfeaturetree: no package.json found, skipping setup.");
  process.exit(0);
}

// Always: patch scripts
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
pkg.scripts = pkg.scripts ?? {};

const genScript = "node node_modules/rbxts-genfeaturetree/genFeatureTree.js";
pkg.scripts.build = `rbxtsc && ${genScript}`;
pkg.scripts.watch = `concurrently "rbxtsc -w" "nodemon --watch out --ext luau --exec '${genScript}'"`;

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log("rbxts-genfeaturetree: updated build and watch scripts in package.json");

// Always: create base folders
for (const dir of ["src/core", "src/features"]) {
  const full = path.join(projectRoot, dir);
  if (!fs.existsSync(full)) {
    fs.mkdirSync(full, { recursive: true });
    console.log(`rbxts-genfeaturetree: created ${dir}/`);
  }
}

if (!isInit) process.exit(0);

// --init: create core subfolders
for (const dir of ["src/core/server", "src/core/client", "src/core/shared"]) {
  const full = path.join(projectRoot, dir);
  if (!fs.existsSync(full)) {
    fs.mkdirSync(full, { recursive: true });
    console.log(`rbxts-genfeaturetree: created ${dir}/`);
  }
}

// --init: move main.server.ts and main.client.ts if they exist at src root
const moves = [
  ["src/main-server.ts", "src/core/server/main-server.ts"],
  ["src/main-client.ts", "src/core/client/main-client.ts"],
];

for (const [from, to] of moves) {
  const src = path.join(projectRoot, from);
  const dest = path.join(projectRoot, to);
  if (fs.existsSync(src) && !fs.existsSync(dest)) {
    fs.renameSync(src, dest);
    console.log(`rbxts-genfeaturetree: moved ${from} → ${to}`);
  }
}

// --init: generate a fresh default.project.json with folder-level paths
const existingProjectPath = path.join(projectRoot, "default.project.json");
const existingProjectName = fs.existsSync(existingProjectPath)
  ? JSON.parse(fs.readFileSync(existingProjectPath, "utf8")).name
  : null;
const projPkgName = existingProjectName ?? pkg.name ?? "roblox-ts-game";
const project = {
  name: projPkgName,
  emitLegacyScripts: false,
  globIgnorePaths: ["**/package.json", "**/tsconfig.json"],
  tree: {
    $className: "DataModel",
    ReplicatedStorage: {
      $className: "ReplicatedStorage",
      rbxts_include: {
        $path: "include",
        node_modules: {
          $className: "Folder",
          "@rbxts": { $path: "node_modules/@rbxts" },
        },
      },
      core: {
        $className: "Folder",
        client: { $path: "out/core/client" },
        shared: { $path: "out/core/shared" },
      },
      features: { $path: "out/features" },
    },
    ServerScriptService: {
      $className: "ServerScriptService",
      core: {
        $className: "Folder",
        server: { $path: "out/core/server" },
      },
    },
  },
};

const projectPath = path.join(projectRoot, "default.project.json");
fs.writeFileSync(projectPath, JSON.stringify(project, null, 2) + "\n");
console.log("rbxts-genfeaturetree: wrote fresh default.project.json (run build to populate)");
