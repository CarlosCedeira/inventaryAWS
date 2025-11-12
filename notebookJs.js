// joinJsxFiles.js
const fs = require("fs");
const path = require("path");

// Carpeta de inicio: donde se ejecuta el script
const startDir = process.cwd();

// Archivo de salida
const outputFile = path.join(startDir, "combinedJS_text.txt");

// Carpetas a ignorar
const ignoreDirs = ["node_modules", ".git", "dist", "build", "front"];

// Patrón de archivo a ignorar (ejemplo: contiene esta marca)
const ignoreFilePattern = "// IGNORE_COMBINE";

// Función recursiva para recorrer carpetas
function getJsxFiles(dir) {
  console.log(`Explorando: ${dir}`);
  let jsxFiles = [];

  const items = fs.readdirSync(dir, { withFileTypes: true });

  items.forEach((item) => {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      if (!ignoreDirs.includes(item.name)) {
        jsxFiles = jsxFiles.concat(getJsxFiles(fullPath)); // Recurse
      }
    } else if (item.isFile() && item.name.endsWith(".js")) {
      // Leer el archivo para ver si contiene la marca de ignorar
      const content = fs.readFileSync(fullPath, "utf-8");
      if (!content.includes(ignoreFilePattern)) {
        jsxFiles.push(fullPath);
      }
    }
  });

  return jsxFiles;
}

// Obtener todos los archivos .js
const jsxFiles = getJsxFiles(startDir);

let combinedContent = "";

// Leer y combinar contenidos
jsxFiles.forEach((file) => {
  const content = fs.readFileSync(file, "utf-8");
  combinedContent += `\n\n===== ${path.basename(file)} =====\n\n`;
  combinedContent += content;
});

// Escribir archivo final
fs.writeFileSync(outputFile, combinedContent, "utf-8");

console.log(`Se combinaron ${jsxFiles.length} archivos .js en ${outputFile}`);
