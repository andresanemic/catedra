'use strict';

// RED de Cátedra. Escrito ANTES del código, el 2026-09-29.
//
// Los ocho casos que este proyecto tiene que presionar, en el orden en que el
// encargo los nombra: matrícula sin acuerdo en vigor; entrega sin declaración de
// uso de IA; nota sin firma del profesor; intento de editar una nota ya firmada;
// estudiante que intenta firmar su propia nota; verificación de una credencial
// alterada; emisión duplicada del mismo título; credencial referida a un curso
// que no existe.
//
// Y tres que el mismo acuerdo obliga: el gate de firmantes del núcleo cuenta
// nombres y no claves; la firma liga contenido y no identidad; y lo que se
// demuestra fuera del medio se demuestra en un proceso que no carga el programa.

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { Catedra, NOMBRES } = require('../src/catedra.js');
const { verificarTitulo, verificarArchivo } = require('../src/fuera.js');
const { verifyReceipt } = require('../src/catedra.js').nucleo;

// Las horas del recorrido.
//
// El reloj del grant es el del núcleo, y el núcleo no recibe un `now` inyectado:
// `sufficient` usa la hora real. Por eso las fechas de la convocatoria de
// ejemplo giran alrededor del día en que corre la suite, y no de un mes fijo: si
// no, el grant de la matrícula quedaría vencido para siempre y la prueba mediría
// otra cosa.
const HOY = new Date();
const dia = (offset) => new Date(HOY.getTime() + offset * 86400000).toISOString();
const T0 = dia(-3);   // dentro de la convocatoria
const T1 = dia(-2);   // dentro, más tarde
const T2 = dia(30);   // pasada la convocatoria
const T3 = dia(-30);  // antes de que abra

const ABRE = dia(-10);
const CIERRA = dia(10);

function temporal() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'catedra-'));
}

// Una universidad de ejemplo: dos asignaturas, cuatro personas, cero datos reales.
function taller(dir) {
  const c = new Catedra({ dir });
  c.ceremoniaDeLlaves([
    { nombre: NOMBRES.estudiante, rol: 'estudiante' },
    { nombre: NOMBRES.profesor, rol: 'profesor' },
    { nombre: NOMBRES.profesorB, rol: 'profesor' },
    { nombre: NOMBRES.oficina, rol: 'oficina-de-titulos' },
  ]);
  c.crearAsignatura({
    id: 'lengua-1', nombre: 'Lengua I', profesor: NOMBRES.profesor,
    creditos: '10', abre: ABRE, cierra: CIERRA,
  });
  c.crearAsignatura({
    id: 'calculo-1', nombre: 'Cálculo I', profesor: NOMBRES.profesorB,
    creditos: '10', abre: ABRE, cierra: CIERRA,
  });
  return c;
}

const MATRICULA = {
  estudiante: NOMBRES.estudiante,
  asignatura: 'lengua-1',
  clave: 'mat-1',
};

const ENTREGA = {
  estudiante: NOMBRES.estudiante,
  asignatura: 'lengua-1',
  clave: 'ent-1',
  texto: 'Análisis del primer capítulo.',
  // La declaración de uso de IA: qué herramienta, en qué proporción y para qué.
  usoIA: { declarado: true, herramienta: 'asistente-generativo', proporcion: 0.25, categoria: 'revisión' },
};

const NOTA = {
  asignatura: 'lengua-1',
  estudiante: NOMBRES.estudiante,
  clave: 'nota-1',
  calificacion: '5',
};

// --- 1. Matrícula sin acuerdo en vigor ---
test('matricular fuera de la convocatoria vuelve bloqueado con la salida nombrada, y no escribe matrícula', async () => {
  const c = taller(temporal());
  const antes = c.matriculas().length;
  const r = await c.matricular({ ...MATRICULA, clave: 'mat-cerrada' }, { now: T2 });
  assert.equal(r.estado, 'bloqueado');
  assert.match(r.detalle, /convocatoria/i);
  assert.ok(r.detalle.includes(CIERRA), `el motivo dice cuándo cerró la convocatoria: ${r.detalle}`);
  assert.ok(r.salida && r.salida.length > 0, 'el bloqueo nombra una salida');
  assert.equal(c.matriculas().length, antes, 'no se escribió ninguna matrícula');
  assert.equal(r.recibo.status, 'blocked');
});

test('matricular antes de que abra la convocatoria también vuelve bloqueado, y dice por qué', async () => {
  const c = taller(temporal());
  const r = await c.matricular({ ...MATRICULA, clave: 'mat-temprana' }, { now: T3 });
  assert.equal(r.estado, 'bloqueado');
  assert.match(r.detalle, /aún no abre|antes de abrir|no está en vigor/i);
  assert.equal(c.matriculas().length, 0);
});

test('dentro de la convocatoria la matrícula sí pasa y deja recibo', async () => {
  const c = taller(temporal());
  const r = await c.matricular(MATRICULA, { now: T0 });
  assert.equal(r.estado, 'verificado', r.detalle);
  assert.equal(c.matriculas().length, 1);
  assert.equal(r.recibo.status, 'verified');
  assert.equal(verifyReceipt(r.recibo).ok, true);
});

// --- 2. Entrega sin declaración de uso de IA ---
test('entregar sin declarar el uso de IA vuelve bloqueado, aunque la matrícula exista', async () => {
  const c = taller(temporal());
  await c.matricular(MATRICULA, { now: T0 });
  const r = await c.entregar({ ...ENTREGA, clave: 'ent-sin-declarar', usoIA: { declarado: false } }, { now: T0 });
  assert.equal(r.estado, 'bloqueado');
  assert.match(r.detalle, /declaraci|uso de IA|no declar/i);
  assert.equal(c.entregas().length, 0, 'no se escribió la entrega');
});

test('entregar sin el campo de uso de IA completo también vuelve bloqueado, y dice qué falta', async () => {
  const c = taller(temporal());
  await c.matricular(MATRICULA, { now: T0 });
  const casos = [
    [{ ...ENTREGA, clave: 'e1', usoIA: { declarado: true, proporcion: 0.1 } }, /herramienta/i],
    [{ ...ENTREGA, clave: 'e2', usoIA: { declarado: true, herramienta: 'x' } }, /proporci/i],
    [{ ...ENTREGA, clave: 'e3', usoIA: { declarado: true, herramienta: 'x', proporcion: 1.5 } }, /proporci/i],
  ];
  for (const [peticion, patron] of casos) {
    const r = await c.entregar(peticion, { now: T0 });
    assert.equal(r.estado, 'bloqueado', `esperaba bloqueo en ${peticion.clave}: ${r.detalle}`);
    assert.match(r.detalle, patron);
    assert.equal(c.entregas().length, 0);
  }
});

test('quien no está matriculado no puede entregar, aunque la convocatoria esté abierta', async () => {
  const c = taller(temporal());
  const r = await c.entregar(ENTREGA, { now: T0 });
  assert.equal(r.estado, 'bloqueado');
  assert.match(r.detalle, /no hay matrícula|matrícula/i);
});

test('la entrega con declaración guardada lleva la proporción y la herramienta en el registro', async () => {
  const c = taller(temporal());
  await c.matricular(MATRICULA, { now: T0 });
  const r = await c.entregar(ENTREGA, { now: T0 });
  assert.equal(r.estado, 'verificado', r.detalle);
  const e = c.entregas()[0];
  assert.equal(e.cuerpo.usoIA.herramienta, 'asistente-generativo');
  assert.equal(e.cuerpo.usoIA.proporcion, 0.25);
  assert.equal(e.cuerpo.usoIA.categoria, 'revisión');
});

// --- 3. Nota sin firma del profesor ---
test('sin que el profesor firme, la nota no se escribe y el núcleo pregunta', async () => {
  const c = taller(temporal());
  await c.matricular(MATRICULA, { now: T0 });
  await c.entregar(ENTREGA, { now: T0 });
  const r = await c.firmarNota(NOTA, { now: T1, firmas: [] });
  assert.equal(r.estado, 'esperando');
  assert.equal(r.recibo.status, 'needs_human_decision');
  assert.match(r.detalle, /missing 1 approval|approval/);
  assert.equal(c.notas().length, 0, 'no se escribió ninguna nota');
});

test('con la firma del profesor la nota se escribe y nombra a quien firmó en el recibo', async () => {
  const c = taller(temporal());
  await c.matricular(MATRICULA, { now: T0 });
  await c.entregar(ENTREGA, { now: T0 });
  const r = await c.firmarNota(NOTA, { now: T1, firmas: [{ by: NOMBRES.profesor }] });
  assert.equal(r.estado, 'verificado', r.detalle);
  assert.equal(c.notas().length, 1);
  assert.equal(r.recibo.decidedBy, NOMBRES.profesor);
  assert.equal(c.notas()[0].cuerpo.firmado_por, NOMBRES.profesor);
});

test('otro profesor no puede firmar la nota de una asignatura que no imparte', async () => {
  const c = taller(temporal());
  await c.matricular(MATRICULA, { now: T0 });
  await c.entregar(ENTREGA, { now: T0 });
  const r = await c.firmarNota(NOTA, { now: T1, firmas: [{ by: NOMBRES.profesorB }] });
  assert.equal(r.estado, 'esperando');
  assert.equal(c.notas().length, 0);
});

// --- 4. Intento de editar una nota ya firmada ---
test('una nota firmada no se edita: la operación no existe', async () => {
  const c = taller(temporal());
  await c.matricular(MATRICULA, { now: T0 });
  await c.entregar(ENTREGA, { now: T0 });
  await c.firmarNota(NOTA, { now: T1, firmas: [{ by: NOMBRES.profesor }] });
  assert.throws(
    () => c.editarNota('nota-1', { calificacion: '1' }, { now: T1, firmas: [{ by: NOMBRES.profesor }] }),
    /no se edita|firmada|no existe la operación/i,
  );
  assert.equal(c.notas()[0].cuerpo.calificacion, '5', 'la nota quedó como estaba');
});

test('corregir una nota firmada se hace con otra nota que la sustituye, y quedan las dos', async () => {
  const c = taller(temporal());
  await c.matricular(MATRICULA, { now: T0 });
  await c.entregar(ENTREGA, { now: T0 });
  await c.firmarNota(NOTA, { now: T1, firmas: [{ by: NOMBRES.profesor }] });
  const r = await c.sustituirNota('nota-1', {
    clave: 'nota-2', calificacion: '4', motivo: 'se corrigió el criterio de evaluación', now: T2,
  }, { firmas: [{ by: NOMBRES.profesor }] });
  assert.equal(r.estado, 'verificado', r.detalle);
  const notas = c.notas();
  assert.equal(notas.length, 2, 'las dos notas quedan en el registro');
  const nueva = notas.find((n) => n.clave === 'nota-2');
  assert.equal(nueva.cuerpo.sustituye, 'nota-1');
  assert.equal(nueva.cuerpo.motivo, 'se corrigió el criterio de evaluación');
});

// --- 5. Estudiante que intenta firmar su propia nota ---
test('la estudiante no puede firmar su propia nota: el núcleo filtra al agente', async () => {
  const c = taller(temporal());
  await c.matricular(MATRICULA, { now: T0 });
  await c.entregar(ENTREGA, { now: T0 });
  const r = await c.firmarNota(
    { ...NOTA, clave: 'nota-propia' },
    { now: T1, firmas: [{ by: NOMBRES.estudiante }], comoAgente: NOMBRES.estudiante },
  );
  assert.equal(r.estado, 'esperando');
  assert.match(r.detalle, /missing 1 approval|approval/);
  assert.equal(c.notas().length, 0, 'no se escribió ninguna nota');
});

test('el gate del núcleo cuenta el nombre que le escriban, aunque no sea el profesor: por eso la firma es otra capa', async () => {
  // Esto NO es un defecto de este proyecto, es una medición del núcleo, y el
  // acuerdo obliga a declararla. Quien ejecuta escribe el nombre del profesor en
  // la puerta y el núcleo lo cuenta como firma. Por eso la firma criptográfica
  // es la capa que decide, y no el nombre.
  const c = taller(temporal());
  await c.matricular(MATRICULA, { now: T0 });
  await c.entregar(ENTREGA, { now: T0 });
  const suplantada = await c.firmarNota(
    { ...NOTA, clave: 'nota-usurpada' },
    { now: T1, firmas: [{ by: NOMBRES.profesor }], comoAgente: NOMBRES.estudiante, suplantarClave: true },
  );
  // El núcleo acepta el nombre: su recibo lo nombra. Eso es lo que se declara.
  assert.equal(suplantada.recibo.decidedBy, NOMBRES.profesor);
  // Y aun así Cátedra no emite la nota: no hay firma criptográfica válida.
  assert.equal(suplantada.estado, 'sin_firma_valida');
  assert.equal(c.notas().length, 0, 'sin clave del profesor no hay nota, aunque el recibo lo nombre');
});

// --- 6. Verificación de una credencial alterada ---
test('un título editado a mano no verifica, y dice que la huella ya no calza', async () => {
  const c = taller(temporal());
  const emitido = await Emitir.ejecutar(c, { now: T1 });
  const titulo = c.titulos()[0];
  const veredicto = verificarTitulo(titulo, emitido.recibo);
  assert.equal(veredicto.ok, true, `sin tocarlo, no verifica: ${veredicto.motivo}`);

  const alterado = { ...titulo, cuerpo: { ...titulo.cuerpo, estudiante: NOMBRES.profesor } };
  const despues = verificarTitulo(alterado, emitido.recibo);
  assert.equal(despues.ok, false);
  assert.match(despues.motivo, /digest|huella|calza/i);
});

test('alterar la firma dentro del título tampoco verifica', async () => {
  const c = taller(temporal());
  const emitido = await Emitir.ejecutar(c, { now: T1 });
  const titulo = c.titulos()[0];
  const alterado = { ...titulo, cuerpo: { ...titulo.cuerpo, firma: { por: 'por-firma-de-cada-nota', firma: 'AA' } } };
  assert.equal(verificarTitulo(alterado, emitido.recibo).ok, false);
});

test('un recibo editado a mano no verifica con el núcleo', async () => {
  const c = taller(temporal());
  const emitido = await Emitir.ejecutar(c, { now: T1 });
  const alterado = { ...emitido.recibo, detail: 'todo bien' };
  const v = verifyReceipt(alterado);
  assert.equal(v.ok, false);
  assert.equal(v.reason, 'digest mismatch');
});

// --- 7. Emisión duplicada del mismo título ---
test('emitir dos veces el mismo título no crea una segunda credencial', async () => {
  const c = taller(temporal());
  const uno = await Emitir.ejecutar(c, { now: T1 });
  const veces = c.titulos().length;
  const dos = await c.emitirTitulo({ estudiante: NOMBRES.estudiante, clave: 'tit-1' }, {
    now: T1, firmas: [{ by: NOMBRES.profesor }, { by: NOMBRES.oficina }],
  });
  assert.equal(dos.estado, 'repetido');
  assert.equal(c.titulos().length, veces, 'sigue habiendo un solo título');
  assert.equal(dos.recibo.digest, uno.recibo.digest, 'devuelve el recibo del primero');
});

test('una clave distinta tampoco duplica el título: la credencial es de la persona y el programa', async () => {
  const c = taller(temporal());
  await Emitir.ejecutar(c, { now: T1 });
  const otro = await c.emitirTitulo({ estudiante: NOMBRES.estudiante, clave: 'tit-otro' }, {
    now: T1, firmas: [{ by: NOMBRES.profesor }, { by: NOMBRES.oficina }],
  });
  assert.equal(otro.estado, 'repetido');
  assert.equal(c.titulos().length, 1);
});

// --- 8. Credencial referida a un curso que no existe ---
test('emitir un título de un curso que no existe vuelve bloqueado, y no escribe nada', async () => {
  const c = taller(temporal());
  const r = await c.emitirTitulo({
    estudiante: NOMBRES.estudiante,
    clave: 'tit-fantasma',
    curso: 'astrofísica-9',
  }, { now: T1, firmas: [{ by: NOMBRES.profesor }, { by: NOMBRES.oficina }] });
  assert.equal(r.estado, 'bloqueado', r.detalle);
  assert.match(r.detalle, /no existe|no hay.*curso|no está en el catálogo/i);
  assert.equal(c.titulos().length, 0);
});

test('no se puede emitir un título de alguien que no está matriculado en nada', async () => {
  const c = taller(temporal());
  const r = await c.emitirTitulo({ estudiante: 'alguien-que-no-existe', clave: 'tit-nadie' }, {
    now: T1, firmas: [{ by: NOMBRES.profesor }, { by: NOMBRES.oficina }],
  });
  assert.equal(r.estado, 'bloqueado');
  assert.equal(c.titulos().length, 0);
});

// --- Lo que el mismo acuerdo obliga ---
test('el título exige dos firmas: con una sola no se emite', async () => {
  const c = taller(temporal());
  const conCurso = await Emitir.ejecutar(c, { now: T1, soloFirmaDelProfesor: true });
  assert.equal(conCurso.estado, 'esperando', conCurso.detalle);
  assert.match(conCurso.detalle, /missing 1 approval|approval/);
  assert.equal(c.titulos().length, 0);
});

test('la firma liga contenido y no identidad: con la clave al lado verifica integridad, y eso se declara', async () => {
  const c = taller(temporal());
  const emitido = await Emitir.ejecutar(c, { now: T1 });
  const titulo = c.titulos()[0];
  const v = verificarTitulo(titulo, emitido.recibo);
  assert.equal(v.ok, true, v.motivo);
  assert.equal(v.checks.firma, true);
  // Y el mismo veredicto dice que no comprobó quién es el titular de la clave.
  assert.match(v.noComprueba, /identidad|quién es el titular/i);
});

test('la verificación fuera del medio corre en un proceso que no carga Cátedra', () => {
  // La afirmación «se verifica sin el programa» es una afirmación sobre un
  // programa. Si la prueba lo importa, no la demuestra: se demuestra en un
  // proceso donde su ruta no está en el caché de módulos.
  const dir = temporal();
  taller(dir);
  const registro = path.join(dir, 'registro.jsonl');
  // `argv[1]` es el propio runner; el módulo y el registro llegan después.
  const codigo = [
    'const { verificarArchivo } = require(process.argv[2]);',
    'const v = verificarArchivo(process.argv[3]);',
    'const modulos = Object.keys(require.cache).filter((k) => k.includes("catedra.js") || k.includes("core" + "\\\\kernel"));',
    'process.stdout.write(JSON.stringify({ ok: v.ok, lineas: v.lineas, modulos }));',
  ].join('\n');
  const runner = path.join(dir, 'runner-fuera.js');
  fs.writeFileSync(runner, codigo, 'utf8');
  const r = spawnSync(
    process.execPath,
    [runner, path.join(__dirname, '..', 'src', 'fuera.js'), registro],
    { encoding: 'utf8' },
  );
  assert.equal(r.status, 0, r.stderr);
  const parsed = JSON.parse(r.stdout);
  assert.deepEqual(parsed.modulos, [], 'el proceso externo cargó el cuerpo del programa o el núcleo');
  assert.equal(parsed.ok, true);
  assert.ok(parsed.lineas > 0, 'el registro externo tenía líneas y ninguna se comprobó');
});

test('un título repetido devuelve el recibo del primero, no uno nuevo', async () => {
  const c = taller(temporal());
  const uno = await Emitir.ejecutar(c, { now: T1 });
  const dos = await c.emitirTitulo({ estudiante: NOMBRES.estudiante, clave: 'tit-1' }, {
    now: T1, firmas: [{ by: NOMBRES.profesor }, { by: NOMBRES.oficina }],
  });
  assert.equal(dos.estado, 'repetido');
  assert.ok(dos.recibo, 'el repetido trae el recibo del primero');
  assert.equal(dos.recibo.digest, uno.recibo.digest);
  assert.equal(c.recibos().filter((r) => r.clave === 'tit-1').length, 1, 'el recibo se escribió una vez');
});

test('el curso que no existe se responde antes que el título repetido', async () => {
  // El orden de las comprobaciones decide el mensaje que recibe quien cometió
  // el error. Contestarle «ya tienes el título» a alguien que pidió un curso
  // inexistente esconde el error real.
  const c = taller(temporal());
  await Emitir.ejecutar(c, { now: T1 });
  const r = await c.emitirTitulo({ estudiante: NOMBRES.estudiante, clave: 'tit-1', curso: 'astrofísica-9' }, {
    now: T1, firmas: [{ by: NOMBRES.profesor }, { by: NOMBRES.oficina }],
  });
  assert.equal(r.estado, 'bloqueado', r.detalle);
  assert.match(r.detalle, /no existe|no está en el catálogo/i);
});

test('un intento sin firma válida queda escrito pero no cuenta como nota', async () => {
  // El rastro de un intento es parte del registro; borrarlo sería quitar la
  // evidencia de que alguien lo intentó. Pero un intento no es un hecho.
  const c = taller(temporal());
  await c.matricular(MATRICULA, { now: T0 });
  await c.entregar(ENTREGA, { now: T0 });
  const r = await c.firmarNota(
    { ...NOTA, clave: 'nota-intento' },
    { now: T1, firmas: [{ by: NOMBRES.profesor }], comoAgente: NOMBRES.estudiante, suplantarClave: true },
  );
  assert.equal(r.estado, 'sin_firma_valida');
  assert.equal(c.notas().length, 0, 'no cuenta como nota');
  assert.equal(c.intentos('nota').length, 1, 'pero el intento queda en el registro');
  const v = verificarArchivo(path.join(c.dir, 'registro.jsonl'));
  assert.equal(v.sinFirmar.length, 1, 'y la verificación externa lo ve como intento sin firma, no como registro editado');
  assert.equal(v.ok, true, 'la huella del intento sí calza: el registro no fue editado');
});

test('la auditoría no cuenta el comprobación ni el recibo como repeticiones del hecho', async () => {
  const c = taller(temporal());
  const emitido = await Emitir.ejecutar(c, { now: T1 });
  const a = c.auditar(emitido.recibo);
  assert.equal(a.ok, true, a.motivo);
  assert.deepEqual(a.checks.slice().sort(), ['entrega-declarada', 'expediente-completo', 'firma-valida', 'matricula-en-registro']);
  assert.ok(a.limite, 'y la auditoría declara el límite del anclaje');
  assert.match(a.limite, /pending|nadie sin este programa/i);
});

test('los cuatro comandos de listado de la terminal funcionan', async () => {
  // Un comando que se cae al listar no es un comando roto de paso: es el que
  // usa alguien para ver qué pasó. Y un `c[tipo]()` mal escrito se cae recién
  // en ejecución, después de que todo lo demás passou.
  const dir = temporal();
  await Emitir.ejecutar(taller(dir), { now: T1 });
  const c = new Catedra({ dir });
  for (const [comando, esperado] of [['matriculas', 'mat-1'], ['entregas', 'ent-1'], ['notas', 'nota-1'], ['titulos', 'tit-1']]) {
    const r = spawnSync(process.execPath, [path.join(__dirname, '..', 'src', 'cli.js'), comando, '--registro', dir], { encoding: 'utf8' });
    assert.equal(r.status, 0, `${comando} falló: ${r.stderr}`);
    assert.ok(r.stdout.includes(esperado), `${comando} no listó ${esperado}: ${r.stdout}`);
  }
});

test('la terminal acepta las banderas antes o después del comando', () => {
  const dir = temporal();
  const cli = path.join(__dirname, '..', 'src', 'cli.js');
  for (const argv of [['asignaturas', '--registro', dir], ['--registro', dir, 'asignaturas']]) {
    const r = spawnSync(process.execPath, [cli, ...argv], { encoding: 'utf8' });
    assert.equal(r.status, 0, `falló: ${r.stderr}`);
    assert.doesNotMatch(r.stdout, /comando desconocido/, `el orden de las palabras rompió la llamada: ${argv.join(' ')}`);
  }
});

test('la terminal devuelve un código distinto de cero cuando el hecho no ocurrió', async () => {
  const dir = temporal();
  const c = taller(dir);
  // Con matrícula y entrega, la única falta es la firma: así el código de salida
  // mide lo que dice medir. Sin preparar nada, la nota se bloquearía por otra
  // razón y la prueba pasaría por el motivo equivocado.
  await c.matricular(MATRICULA, { now: T0 });
  await c.entregar(ENTREGA, { now: T0 });
  const cli = path.join(__dirname, '..', 'src', 'cli.js');
  const sinFirmar = spawnSync(process.execPath, [cli, 'notar', '--estudiante', NOMBRES.estudiante, '--asignatura', 'lengua-1', '--clave', 'nota-1', '--calificacion', '5', '--registro', dir], { encoding: 'utf8' });
  assert.equal(sinFirmar.status, 1, 'sin firma tiene que salir distinto de cero, para que un script no lo tome por un hecho');
  assert.ok(sinFirmar.stdout.includes('esperando'), `y su salida lo dice: ${sinFirmar.stdout}`);

  const conFirma = spawnSync(process.execPath, [cli, 'notar', '--estudiante', NOMBRES.estudiante, '--asignatura', 'lengua-1', '--clave', 'nota-1', '--calificacion', '5', '--firma', NOMBRES.profesor, '--registro', dir], { encoding: 'utf8' });
  assert.equal(conFirma.status, 0, `con la firma del profesor tiene que salir cero: ${conFirma.stderr}`);
});

test('la verificación externa declara en su propio resultado lo que no alcanza', () => {
  const dir = temporal();
  taller(dir);
  const v = verificarArchivo(path.join(dir, 'registro.jsonl'));
  assert.equal(v.ok, true);
  assert.ok(v.noAlcanza.length >= 3, 'la salida dice qué no compra');
  assert.ok(v.noAlcanza.some((x) => /anclaje|red|explorador/i.test(x)), 'y dice que el anclaje quedó en pending');
  assert.ok(v.noAlcanza.some((x) => /identidad|clave privada/i.test(x)), 'y que la firma no acredita identidad');
});

// Un ayudante para el camino feliz del título, que los rojos necesitan.
const Emitir = {
  async ejecutar(c, { now, soloFirmaDelProfesor = false } = {}) {
    await c.matricular(MATRICULA, { now: T0 });
    await c.matricular({ ...MATRICULA, asignatura: 'calculo-1', clave: 'mat-2' }, { now: T0 });
    await c.entregar(ENTREGA, { now: T0 });
    await c.entregar({ ...ENTREGA, asignatura: 'calculo-1', clave: 'ent-2' }, { now: T0 });
    await c.firmarNota(NOTA, { now: T1, firmas: [{ by: NOMBRES.profesor }] });
    await c.firmarNota(
      { ...NOTA, asignatura: 'calculo-1', clave: 'nota-2', calificacion: '4' },
      { now: T1, firmas: [{ by: NOMBRES.profesorB }] },
    );
    const firmas = soloFirmaDelProfesor
      ? [{ by: NOMBRES.profesor }]
      : [{ by: NOMBRES.profesor }, { by: NOMBRES.oficina }];
    return c.emitirTitulo({ estudiante: NOMBRES.estudiante, clave: 'tit-1' }, { now, firmas });
  },
};
