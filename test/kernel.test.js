'use strict';

// El corte del núcleo, verificado por bytes.
//
// Cátedra consume la copia del kernel que Lore Plugin instala en los tres hosts.
// Esa copia tiene un encabezado de procedencia de tres líneas y, debajo, los bytes
// exactos del commit fijado. Estos cinco digest son los que ese `SOURCE.md`
// declara; si el corte se mueve, esta prueba falla en vez de dejar que el proyecto
// siga corriendo contra un núcleo que nadie revisó.
//
// Cuando RC6 instale un núcleo distinto, esta suite se pondrá roja a propósito, con
// el mensaje de repinar. Eso es el control funcionando, no una regresión: reevaluar
// la huella es decisión de Andrés.

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const KERNEL = path.join(__dirname, '..', 'vendor', 'vespi-kernel');

const ESPERADOS = {
  'authority.js': 'fcf7952489d6f9c42616b52f54832524926d2f2ba6c0ea6514480a7bdc7a265e',
  'continuity.js': 'abbee9cab8c92b2c4680dba2d573bf8eb6a50ab63194e4a0b0b525af5f044e6c',
  'delegation.js': '357d8b9398ac2b2c3508565e6c2293cc6abff3801f09a60f985dc1c781e002a3',
  'operation.js': '9a95815fc10435cb55415da1531e1545168eaf209518630b83f24b10f0e78d48',
  'receipt.js': 'd006eff3538b2c701366ba09d1e41a32d267b2bad44177f0095541ce9b2a644d',
};

function cuerpo(archivo) {
  const crudo = fs.readFileSync(path.join(KERNEL, archivo));
  return crudo.slice(crudo.indexOf(10, crudo.indexOf(10, crudo.indexOf(10) + 1) + 1) + 1);
}

test('el núcleo que consume Cátedra es el corte fijado, módulo por módulo', () => {
  for (const [archivo, esperado] of Object.entries(ESPERADOS)) {
    const real = createHash('sha256').update(cuerpo(archivo)).digest('hex');
    assert.equal(real, esperado, `${archivo}: el núcleo se movió; repínalo a mano y vuelve a correr la suite`);
  }
});

test('el encabezado de los cinco módulos declara el mismo commit', () => {
  const commits = new Set();
  for (const archivo of Object.keys(ESPERADOS)) {
    const lineas = fs.readFileSync(path.join(KERNEL, archivo), 'utf8').split('\n').slice(0, 3).join(' ');
    const encontrado = lineas.match(/commit ([0-9a-f]{7,40})/);
    assert.ok(encontrado, `${archivo}: el encabezado no declara un commit`);
    commits.add(encontrado[1].slice(0, 7));
  }
  assert.equal(commits.size, 1, `los cinco módulos no apuntan al mismo commit: ${[...commits].join(', ')}`);
});

// 0.1.5: el corte ya no viaja en la copia que los hosts instalan bajo
// `lore-plugin/core/kernel`, sino en `vendor/vespi-kernel/`, declarada por su
// propio `SOURCE.md`. La prueba anterior afirmaba la ruta del host, así que
// quedó roja cuando el corte se movió: medía un archivo que el proyecto ya no
// carga. Ahora se verifica lo mismo —que lo que Cátedra carga es el corte
// fijado— contra la ruta real y contra el manifiesto, no contra una ruta ajena.
const COMMIT_FIJADO = 'ed559e83c976dd6e6a379a5510db776206f670b4';

function manifiesto() {
  const md = fs.readFileSync(path.join(KERNEL, 'SOURCE.md'), 'utf8');
  const filas = [...md.matchAll(/\|\s*`([^`]+\.js)`\s*\|\s*`([0-9a-f]{64})`/g)];
  assert.ok(filas.length > 0, 'el SOURCE.md no declara ningún módulo');
  return filas;
}

test('Cátedra carga el núcleo desde la copia vendorizada, no desde el árbol de desarrollo', () => {
  // Si alguien cambia la constante `KERNEL` del proyecto al árbol canónico
  // (`founder/proyectos/vespi/kernel/src`), el corte deja de estar fijado aunque
  // las huellas de arriba sigan dando verde sobre la copia correcta: estarían
  // midiendo un archivo que el proyecto ya no carga.
  const fuente = fs.readFileSync(path.join(__dirname, '..', 'src', 'catedra.js'), 'utf8');
  const asignado = fuente.match(/const KERNEL\s*=\s*(['"`])([^'"`]+)\1/);
  assert.ok(asignado, 'no se encontró la constante KERNEL en src/catedra.js');
  const ruta = asignado[2];
  assert.equal(
    ruta.replace(/\\/g, '/'),
    '../vendor/vespi-kernel',
    `el núcleo se carga de ${ruta} y no del corte vendorizado`,
  );
  // Y que efectivamente resuelva: la ruta tiene que existir en esta máquina.
  const resuelta = path.resolve(__dirname, '..', 'src', ruta, 'receipt.js');
  assert.ok(fs.existsSync(resuelta), `la ruta del núcleo no resuelve: ${resuelta}`);
});

test('la copia vendorizada calza con su SOURCE.md, módulo por módulo y commit', () => {
  const filas = manifiesto();

  // Cada módulo declarado existe, y sus bytes son los que el manifiesto afirma.
  for (const [, archivo, esperado] of filas) {
    const bytes = fs.readFileSync(path.join(KERNEL, archivo));
    const real = createHash('sha256').update(cuerpo(archivo)).digest('hex');
    assert.equal(real, esperado, `${archivo}: el vendorizado no calza con su SOURCE.md`);
    assert.ok(bytes.length > 0, `${archivo}: el módulo está vacío`);
  }

  // Y ningún módulo suelto: lo que no está declarado, no está fijado.
  const declarados = new Set(filas.map(([, archivo]) => archivo));
  for (const archivo of fs.readdirSync(KERNEL)) {
    if (archivo.endsWith('.js')) {
      assert.ok(declarados.has(archivo), `${archivo}: está en el corte pero no en el SOURCE.md`);
    }
  }

  // El encabezado de cada módulo declara el commit fijado, no otro.
  for (const [, archivo] of filas) {
    const cabecera = fs.readFileSync(path.join(KERNEL, archivo), 'utf8').split('\n').slice(0, 3).join(' ');
    const encontrado = cabecera.match(/commit ([0-9a-f]{7,40})/);
    assert.ok(encontrado, `${archivo}: el encabezado no declara un commit`);
    assert.ok(
      COMMIT_FIJADO.startsWith(encontrado[1]),
      `${archivo}: el encabezado declara ${encontrado[1]} y no el corte ${COMMIT_FIJADO.slice(0, 7)}`,
    );
  }
});
