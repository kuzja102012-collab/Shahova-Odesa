<?php
/* Шахова Одеса — публікація змін із редактора сайту (сторінка #/editor).
 *
 * Що робить: приймає від редактора оновлений вміст сайту (новини, анонси, результати, контакти)
 * і завантажені фото/документи, зберігає їх на хостингу та робить резервну копію попередньої версії.
 * Пароль задається у файлі publish-config.php. Поки пароль порожній — публікація вимкнена.
 *
 * Потрібен PHP 7.4 або новіший.
 * Дії (POST, поле action): ping · upload · save · backups · restore. Кожен запит містить пароль (поле key).
 */
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

const ROOT = __DIR__;
const DATA_FILE = ROOT . '/site-data.json';
const INDEX_FILE = ROOT . '/index.html';
const PRIV = ROOT . '/_private';
const BACKUPS = PRIV . '/backups';
const MAX_DATA = 12 * 1024 * 1024;   // вміст сайту (JSON)
const MAX_IMAGE = 15 * 1024 * 1024;  // фото й скани (редактор зменшує їх перед відправкою)
const MAX_DOC = 30 * 1024 * 1024;    // PDF, Word, Excel
const KEEP_BACKUPS = 60;
const MAX_FAILS = 10;                // невдалих спроб пароля з однієї адреси за 15 хвилин

function out(array $a, int $code = 200): void {
  http_response_code($code);
  echo json_encode($a, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}
function fail(string $msg, int $code = 400): void { out(['ok' => false, 'error' => $msg], $code); }

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') fail('Сторінка приймає лише запити редактора.', 405);

// запит має йти з цього ж сайту
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
  $oh = strtolower((string)parse_url($origin, PHP_URL_HOST));
  $hh = strtolower(explode(':', (string)($_SERVER['HTTP_HOST'] ?? ''))[0]);
  if ($oh === '' || $oh !== $hh) fail('Запит з іншого сайту відхилено.', 403);
}

// службова тека: спроби входу, резервні копії. Закрита від відвідувачів.
function ensurePrivate(): void {
  if (!is_dir(BACKUPS)) @mkdir(BACKUPS, 0755, true);
  if (!is_file(PRIV . '/.htaccess')) {
    @file_put_contents(PRIV . '/.htaccess', "<IfModule mod_authz_core.c>\nRequire all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\nDeny from all\n</IfModule>\n");
  }
  if (!is_file(PRIV . '/index.html')) @file_put_contents(PRIV . '/index.html', '');
}
ensurePrivate();

// ── пароль ──
$cfg = is_file(ROOT . '/publish-config.php') ? (require ROOT . '/publish-config.php') : [];
$secret = is_array($cfg) ? (string)($cfg['password'] ?? '') : '';
if (strlen($secret) < 8) fail('Публікацію ще не налаштовано: задайте пароль (щонайменше 8 символів) у файлі publish-config.php на хостингу.', 503);

$ip = (string)($_SERVER['REMOTE_ADDR'] ?? '?');
$attemptsFile = PRIV . '/attempts.json';
function readAttempts(string $f): array {
  $a = is_file($f) ? json_decode((string)@file_get_contents($f), true) : [];
  return is_array($a) ? $a : [];
}
$att = readAttempts($attemptsFile);
$now = time();
foreach ($att as $k => $list) {
  $att[$k] = array_values(array_filter((array)$list, function ($t) use ($now) { return $now - (int)$t < 900; }));
  if (!$att[$k]) unset($att[$k]);
}
if (count($att[$ip] ?? []) >= MAX_FAILS) fail('Забагато невдалих спроб. Спробуйте через 15 хвилин.', 429);

$key = (string)($_POST['key'] ?? '');
// у конфігурації можна тримати і сам пароль, і його хеш (password_hash)
$hashed = strncmp($secret, '$2y$', 4) === 0 || strncmp($secret, '$argon', 6) === 0;
$good = $hashed ? password_verify($key, $secret) : hash_equals($secret, $key);
if (!$good) {
  $att[$ip][] = $now;
  @file_put_contents($attemptsFile, json_encode($att), LOCK_EX);
  sleep(1);
  fail('Невірний пароль.', 401);
}
if (isset($att[$ip])) { unset($att[$ip]); @file_put_contents($attemptsFile, json_encode($att), LOCK_EX); }

// ── допоміжне ──
function bytes(string $v): int {
  $v = trim($v); $n = (int)$v; $u = strtolower(substr($v, -1));
  return $u === 'g' ? $n << 30 : ($u === 'm' ? $n << 20 : ($u === 'k' ? $n << 10 : $n));
}
function writeAtomic(string $file, string $content): void {
  $tmp = $file . '.tmp-' . bin2hex(random_bytes(4));
  if (@file_put_contents($tmp, $content, LOCK_EX) !== strlen($content)) { @unlink($tmp); fail('Не вдалося записати файл на хостингу (перевірте права на запис).', 500); }
  @chmod($tmp, 0644);
  if (!@rename($tmp, $file)) { @unlink($tmp); fail('Не вдалося замінити файл на хостингу.', 500); }
}
function slug(string $s): string {
  $s = strtolower((string)preg_replace('/[^A-Za-z0-9]+/', '-', $s));
  $s = trim(substr(trim($s, '-'), 0, 60), '-');
  return $s !== '' ? $s : 'file';
}
// тип файлу — за вмістом, а не за назвою
function sniff(string $path, string $origName): ?string {
  $h = (string)@file_get_contents($path, false, null, 0, 16);
  if (strncmp($h, "\xFF\xD8\xFF", 3) === 0) return 'jpg';
  if (strncmp($h, "\x89PNG", 4) === 0) return 'png';
  if (strncmp($h, 'RIFF', 4) === 0 && substr($h, 8, 4) === 'WEBP') return 'webp';
  if (strncmp($h, '%PDF-', 5) === 0) return 'pdf';
  $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
  if (strncmp($h, "\xD0\xCF\x11\xE0", 4) === 0) return in_array($ext, ['doc', 'xls'], true) ? $ext : 'doc';
  if (strncmp($h, "PK\x03\x04", 4) === 0 && in_array($ext, ['docx', 'xlsx'], true)) return $ext;
  return null;
}
function uploadError(int $code): string {
  if ($code === UPLOAD_ERR_INI_SIZE || $code === UPLOAD_ERR_FORM_SIZE) return 'Файл завеликий для налаштувань хостингу (upload_max_filesize = ' . ini_get('upload_max_filesize') . ').';
  if ($code === UPLOAD_ERR_PARTIAL) return 'Файл завантажився не повністю — спробуйте ще раз.';
  if ($code === UPLOAD_ERR_NO_FILE) return 'Файл не вибрано.';
  return 'Не вдалося отримати файл (код ' . $code . ').';
}
function validData(string $raw): array {
  if ($raw === '' || strlen($raw) > MAX_DATA) fail('Порожні або завеликі дані.');
  $d = json_decode($raw, true, 64);
  if (!is_array($d)) fail('Дані пошкоджено (некоректний JSON).');
  foreach (['news', 'announcements', 'results'] as $k) {
    if (!isset($d[$k]) || !is_array($d[$k]) || array_values($d[$k]) !== $d[$k]) fail("У даних немає розділу «{$k}».");
  }
  if (!isset($d['contacts']) || !is_array($d['contacts']) || !isset($d['about']) || !is_array($d['about'])) fail('У даних немає контактів або сторінки «Про нас».');
  foreach ($d['news'] as $n) if (!is_array($n) || empty($n['id']) || !isset($n['title'])) fail('Знайдено новину без ідентифікатора або заголовка.');
  return $d;
}
// записує site-data.json і вбудовану копію даних в index.html (сайт працює й без окремого запиту за даними)
function publishData(array $d): string {
  $d['updated'] = gmdate('Y-m-d\TH:i:s\Z');
  // компактно (сторінка легша); JSON_HEX_TAG — щоб «</script>» у тексті не зламав сторінку
  $json = json_encode($d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG);
  if ($json === false) fail('Не вдалося підготувати дані.', 500);
  if (is_file(DATA_FILE)) @copy(DATA_FILE, BACKUPS . '/site-data-' . date('Ymd-His') . '.json');
  $old = glob(BACKUPS . '/site-data-*.json') ?: [];
  rsort($old);
  foreach (array_slice($old, KEEP_BACKUPS) as $f) @unlink($f);
  writeAtomic(DATA_FILE, $json);
  $html = (string)@file_get_contents(INDEX_FILE);
  $s = strpos($html, 'const DATA = {');
  $e = $s === false ? false : strpos($html, "\n};\n", $s);
  if ($s !== false && $e !== false) {
    $day = BACKUPS . '/index-' . date('Ymd') . '.html';
    if (!is_file($day)) @copy(INDEX_FILE, $day);
    // закриваюча дужка — з нового рядка: за маркером «\n};\n» блок знаходять і наступна публікація, і build.js
    writeAtomic(INDEX_FILE, substr($html, 0, $s) . 'const DATA = ' . substr($json, 0, -1) . "\n};\n" . substr($html, $e + 4));
  }
  return $d['updated'];
}

// ── дії ──
$action = (string)($_POST['action'] ?? '');

if ($action === 'ping') {
  $cur = is_file(DATA_FILE) ? json_decode((string)file_get_contents(DATA_FILE), true) : null;
  out(['ok' => true, 'updated' => is_array($cur) ? ($cur['updated'] ?? '') : '',
    'maxUpload' => min(bytes((string)ini_get('upload_max_filesize')), bytes((string)ini_get('post_max_size')))]);
}

if ($action === 'upload') {
  $dirs = ['photo' => 'photos', 'scan' => 'scans', 'doc' => 'docs'];
  $kind = (string)($_POST['kind'] ?? '');
  if (!isset($dirs[$kind])) fail('Невідомий тип файлу.');
  $f = $_FILES['file'] ?? null;
  if (!is_array($f) || (int)($f['error'] ?? -1) !== UPLOAD_ERR_OK) fail(uploadError(is_array($f) ? (int)$f['error'] : UPLOAD_ERR_NO_FILE));
  if (!is_uploaded_file($f['tmp_name'])) fail('Файл не отримано.');
  $ext = sniff($f['tmp_name'], (string)$f['name']);
  $images = ['jpg', 'png', 'webp'];
  if ($ext === null || ($kind !== 'doc' && !in_array($ext, $images, true))) fail($kind === 'doc' ? 'Дозволено PDF, Word, Excel або зображення.' : 'Дозволено лише зображення (JPG, PNG, WebP).');
  if (in_array($ext, $images, true) && @getimagesize($f['tmp_name']) === false) fail('Файл зображення пошкоджено.');
  if ((int)$f['size'] > (in_array($ext, $images, true) ? MAX_IMAGE : MAX_DOC)) fail('Файл завеликий.');
  $month = date('Y-m');
  $rel = 'assets/' . $dirs[$kind] . '/' . $month;
  $dir = ROOT . '/' . $rel;
  if (!is_dir($dir) && !@mkdir($dir, 0755, true)) fail('Не вдалося створити теку ' . $rel . ' (перевірте права на запис).', 500);
  $base0 = slug((string)($_POST['name'] ?? 'file')); $base = $base0; $i = 2;
  while (is_file("$dir/$base.$ext") || is_file("$dir/t/$base.$ext")) $base = $base0 . '-' . $i++;
  if (!@move_uploaded_file($f['tmp_name'], "$dir/$base.$ext")) fail('Не вдалося зберегти файл.', 500);
  @chmod("$dir/$base.$ext", 0644);
  $res = ['ok' => true, 'src' => "$rel/$base.$ext"];
  // мініатюра для фото (готує редактор)
  $t = $_FILES['thumb'] ?? null;
  if ($kind === 'photo' && is_array($t) && (int)($t['error'] ?? -1) === UPLOAD_ERR_OK && is_uploaded_file($t['tmp_name'])) {
    $te = sniff($t['tmp_name'], (string)$t['name']);
    if ($te === $ext && (int)$t['size'] <= MAX_IMAGE && @getimagesize($t['tmp_name']) !== false) {
      if (!is_dir("$dir/t")) @mkdir("$dir/t", 0755, true);
      if (@move_uploaded_file($t['tmp_name'], "$dir/t/$base.$ext")) { @chmod("$dir/t/$base.$ext", 0644); $res['thumb'] = "$rel/t/$base.$ext"; }
    }
  }
  out($res);
}

if ($action === 'save') {
  $d = validData((string)($_POST['data'] ?? ''));
  out(['ok' => true, 'updated' => publishData($d)]);
}

if ($action === 'backups') {
  $list = [];
  $files = glob(BACKUPS . '/site-data-*.json') ?: [];
  rsort($files);
  foreach (array_slice($files, 0, KEEP_BACKUPS) as $f) $list[] = ['name' => basename($f), 'size' => filesize($f), 'time' => date('c', (int)filemtime($f))];
  out(['ok' => true, 'backups' => $list]);
}

if ($action === 'restore') {
  $name = (string)($_POST['name'] ?? '');
  if (!preg_match('/^site-data-\d{8}-\d{6}\.json$/', $name) || !is_file(BACKUPS . '/' . $name)) fail('Копію не знайдено.');
  $d = validData((string)file_get_contents(BACKUPS . '/' . $name));
  out(['ok' => true, 'updated' => publishData($d)]);
}

fail('Невідома дія.');
