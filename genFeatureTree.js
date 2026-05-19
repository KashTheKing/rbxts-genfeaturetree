const fs = require("fs");
const path = require("path");

const OUT_PATH = path.join(process.cwd(), "out");

function toPosix(p) {
  return p.split(path.sep).join("/");
}

function getVirtualPath(filepath) {
  const relative = path.relative(OUT_PATH, filepath);
  const parts = relative.split(path.sep);
  const basename = path.basename(filepath);

  const isServer = basename.endsWith("-server.luau");
  const isClient = basename.endsWith("-client.luau");

  // Strip .luau (and -server/-client) for the node name
  const name = basename.replace(/-(server|client)\.luau$/, "").replace(/\.luau$/, "");

  const folder = parts.slice(0, -1);
  const target = isServer ? "ServerScriptService" : "ReplicatedStorage";

  return {
    target,
    folder,
    name,
    file: toPosix(path.join("out", relative)),
  };
}

const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"));

const tree = {
  name: pkg.name ?? "roblox-ts-game",
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
    },
    ServerScriptService: {
      $className: "ServerScriptService",
    },
  },
};

function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, callback);
    } else if (entry.isFile() && entry.name.endsWith(".luau")) {
      callback(full);
    }
  });
}

walk(OUT_PATH, (filepath) => {
  const { target, folder, name, file } = getVirtualPath(filepath);
  const root = tree.tree[target];

  let current = root;
  for (const part of folder) {
    if (!current[part]) current[part] = { $className: "Folder" };
    current = current[part];
  }

  current[name] = { $path: file };
});

fs.writeFileSync("default.project.json", JSON.stringify(tree, null, 2));
console.log("✅ default.project.json generated.");
