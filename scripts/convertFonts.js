// scripts/convertFonts.js
const fs = require('fs');
const path = require('path');
const fontmin = require('fontmin');

const inputDir = path.join(__dirname, '../src/assets/fonts');
const outputDir = path.join(__dirname, '../dist/assets/fonts');
const scssFile = path.join(__dirname, '../src/assets/scss/_fonts.scss');
const cacheFile = path.join(__dirname, '.fontcache.json');

// Создаём папки
[outputDir, path.dirname(scssFile)].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Читаем кэш
let cache = {};
if (fs.existsSync(cacheFile)) {
  try {
    cache = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
  } catch (e) {
    console.error('Ошибка чтения кэша:', e);
    cache = {};
  }
}

// Собираем текущие шрифты
const files = fs.readdirSync(inputDir).filter(f => /\.(ttf|otf)$/i.test(f));

if (files.length === 0) {
  console.log('⚠️ Нет шрифтов для конвертации.');
  process.exit(0);
}

const current = {};
files.forEach(file => {
  const filePath = path.join(inputDir, file);
  const stat = fs.statSync(filePath);
  current[file] = `${stat.size}-${stat.mtimeMs}`;
});

// Проверяем изменения
const hasChanges = Object.keys(current).some(file => cache[file] !== current[file]);
if (!hasChanges) {
  console.log('✅ Шрифты не изменились. Пропускаем конвертацию.');
  process.exit(0);
}

console.log('🔄 Шрифты изменились. Запускаем конвертацию...');

// Конвертируем
files.forEach(file => {
  const filePath = path.join(inputDir, file);
  const filename = path.basename(file, path.extname(file));

  new fontmin()
    .src(filePath)
    .use(fontmin.ttf2woff())
    .use(fontmin.ttf2woff2())
    .dest(outputDir)
    .run(err => {
      if (err) throw err;
      console.log(`✅ ${file} → woff + woff2`);
    });
});

// Генерируем SCSS
const scssContent = files.map(file => {
  const filename = path.basename(file, path.extname(file));
  return `
@font-face {
  font-family: '${filename}';
  src: url('../fonts/${filename}.woff') format('woff'),
       url('../fonts/${filename}.woff2') format('woff2');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
`;
}).join('\n\n').trim();

fs.writeFileSync(scssFile, scssContent);
console.log('✅ _fonts.scss обновлён');

// Сохраняем кэш
fs.writeFileSync(cacheFile, JSON.stringify(current, null, 2));
console.log('✅ Кэш шрифтов сохранён');