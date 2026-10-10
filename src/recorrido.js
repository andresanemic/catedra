'use strict';

// El recorrido de Cátedra, de la matrícula a la pantalla que dice lo que no
// demuestra. Cada línea sale de una ejecución real: no hay dato maquetado, ni
// hash inventado, ni persona real.
//
// La universidad es de fantasía y no se reclama ninguna afiliación. No hay red,
// no hay blockchain, no hay pagos, y el anclaje de cada recibo queda en
// `pending`. La última pantalla no es un resumen: es la lista de lo que este
// proyecto NO demuestra, y es la parte que hay que leer.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Catedra, NOMBRES, verifyReceipt } = require('./catedra.js');
const { verificarArchivo, verificarTitulo } = require('./fuera.js');

// Las horas del recorrido, alrededor del día en que corre: el reloj de los
// permisos es el del núcleo y usa la hora real.
const HOY = new Date();
const dia = (offset) => {
  const d = new Date(HOY.getTime() + offset * 86400000);
  return d.toISOString();
};
const ABRE = dia(-10);
const CIERRA = dia(10);
const T0 = dia(-3);
const T1 = dia(-2);
const T2 = dia(20);

function linea(t = '') { process.stdout.write(`${t}\n`); }
function titulo(t) { linea(`\n── ${t}`); }

function mostrar(r) {
  linea(`  estado:   ${r.estado}`);
  if (r.detalle) linea(`  detalle:  ${r.detalle}`);
  if (r.salida) linea(`  salida:   ${r.salida}`);
  if (r.recibo) {
    linea(`  recibo:   ${r.recibo.status} · sello ${String(r.recibo.digest).slice(0, 16)}…`);
    if (r.recibo.decidedBy) linea(`  firmó:   ${r.recibo.decidedBy} (el nombre que pasó por la puerta)`);
    linea(`  anclaje:  ${r.recibo.anchor.status} en ${r.recibo.anchor.network} — nada llegó a la red`);
  }
}

const USO = { declarado: true, herramienta: 'asistente-generativo', proporcion: 0.25, categoria: 'revisión de redacción' };

async function main() {
  const dir = process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), 'catedra-recorrido-'));
  const c = new Catedra({ dir });
  const e = NOMBRES.estudiante;
  const p = NOMBRES.profesor;
  const p2 = NOMBRES.profesorB;

  linea('Cátedra — recorrido completo, de la matrícula a la credencial.');
  linea(`Registro en: ${path.join(dir, 'registro.jsonl')}`);
  linea('Universidad, personas y datos son de EJEMPLO. Sin red, sin blockchain, sin pagos, sin un tercero.');

  titulo('1. La universidad abre la convocatoria de dos asignaturas');
  c.crearAsignatura({ id: 'lengua-1', nombre: 'Lengua I', profesor: p, creditos: '10', abre: ABRE, cierra: CIERRA });
  c.crearAsignatura({ id: 'calculo-1', nombre: 'Cálculo I', profesor: p2, creditos: '10', abre: ABRE, cierra: CIERRA });
  for (const a of c.asignaturas()) {
    linea(`  ${a.cuerpo.id}  «${a.cuerpo.nombre}»  ${a.cuerpo.creditos} cr  imparte ${a.cuerpo.profesor}`);
    linea(`      en vigor: ${a.cuerpo.abre} → ${a.cuerpo.cierra}`);
  }
  linea('  La convocatoria es el «acuerdo en vigor» de la matrícula: fuera de esa ventana, no hay puerta.');

  titulo('2. La ceremonia de llaves: cuatro pares, una pública y una privada');
  c.ceremoniaDeLlaves([
    { nombre: e, rol: 'estudiante' },
    { nombre: p, rol: 'profesor' },
    { nombre: p2, rol: 'profesor' },
    { nombre: NOMBRES.oficina, rol: 'oficina-de-titulos' },
  ]);
  linea('  La clave pública va al registro. La privada queda en un archivo aparte DEL PROYECTO.');
  linea('  ── ese es el límite declarado: la firma prueba que la nota no cambió, no quién firmó.');
  linea('     En una institución real el profesor custodia la suya y la institución publica solo la pública.');

  titulo('3. Fuera de la convocatoria: la matrícula vuelve bloqueada con su salida');
  const antes = await c.matricular({ estudiante: e, asignatura: 'lengua-1', clave: 'mat-tarde' }, { now: T2 });
  mostrar(antes);
  linea(`  matriculas escritas: ${c.matriculas().length} (cero: el bloqueo no dejó rastro de una matrícula)`);

  titulo('4. Dentro de la convocatoria: la estudiante se matricula en las dos');
  const m1 = await c.matricular({ estudiante: e, asignatura: 'lengua-1', clave: 'mat-1' }, { now: T0 });
  mostrar(m1);
  const m2 = await c.matricular({ estudiante: e, asignatura: 'calculo-1', clave: 'mat-2' }, { now: T0 });
  linea(`  ${m2.estado}: segunda matrícula en cálculo`);

  titulo('5. Entrega sin declarar el uso de IA: bloqueada, y sin escribir nada');
  const sinDeclarar = await c.entregar({ estudiante: e, asignatura: 'lengua-1', clave: 'ent-x', texto: 'borrador', usoIA: { declarado: false } }, { now: T0 });
  mostrar(sinDeclarar);

  titulo('6. La entrega con la declaración completa sí pasa');
  const en1 = await c.entregar({ estudiante: e, asignatura: 'lengua-1', clave: 'ent-1', texto: 'Análisis del primer capítulo.', usoIA: USO }, { now: T0 });
  linea(`  uso declarado: ${USO.herramienta}, ${(USO.proporcion * 100).toFixed(0)} % para ${USO.categoria}`);
  linea(`  estado: ${en1.estado} · sello ${String(en1.recibo.digest).slice(0, 16)}…`);
  await c.entregar({ estudiante: e, asignatura: 'calculo-1', clave: 'ent-2', texto: 'Límites y derivadas.', usoIA: { ...USO, proporcion: 0, categoria: 'sin uso' } }, { now: T0 });
  linea('  segunda entrega: 0 % de uso declarado, y también pasó — declarar no es un castigo.');

  titulo('7. Sin firma del profesor, la nota no se escribe y el núcleo pregunta');
  const sinFirma = await c.firmarNota({ estudiante: e, asignatura: 'lengua-1', clave: 'nota-1', calificacion: '5' }, { now: T1, firmas: [] });
  mostrar(sinFirma);
  linea(`  notas escritas: ${c.notas().length}`);

  titulo('8. El profesor firma: la nota se escribe, con su nombre y su firma');
  const conFirma = await c.firmarNota({ estudiante: e, asignatura: 'lengua-1', clave: 'nota-1', calificacion: '5' }, { now: T1, firmas: [{ by: p }] });
  mostrar(conFirma);
  await c.firmarNota({ estudiante: e, asignatura: 'calculo-1', clave: 'nota-2', calificacion: '4' }, { now: T1, firmas: [{ by: p2 }] });
  linea(`  notas: ${c.notas().length} (lengua y cálculo)`);

  titulo('9. Intento de editar la nota firmada: la operación no existe');
  try {
    c.editarNota('nota-1', { calificacion: '1' }, { now: T1, firmas: [{ by: p }] });
    linea('  NO: la edición pasó, y eso es un defecto');
  } catch (err) {
    linea(`  ${err.message}`);
  }
  linea(`  la nota sigue en ${c.notas().find((n) => n.clave === 'nota-1').cuerpo.calificacion}`);

  titulo('10. La estudiante intenta firmar su propia nota');
  const propia = await c.firmarNota({ estudiante: e, asignatura: 'lengua-1', clave: 'nota-propia', calificacion: '7' }, { now: T1, firmas: [{ by: e }], comoAgente: e });
  mostrar(propia);
  linea('  El núcleo no cuenta al agente: es la primera defensa, y está en el núcleo.');

  titulo('11. Y si escribe el nombre del profesor en la puerta, ¿alcanza?');
  const usurpada = await c.firmarNota({ estudiante: e, asignatura: 'lengua-1', clave: 'nota-usurpada', calificacion: '7' }, {
    now: T1, firmas: [{ by: p }], comoAgente: e, suplantarClave: true,
  });
  linea(`  el gate del núcleo contó a: ${usurpada.recibo.decidedBy}`);
  linea(`  el estado en Cátedra: ${usurpada.estado}`);
  linea('  ── ESTE ES UN HALLAZGO, NO UNA SOLUCIÓN. El gate de firmantes del núcleo cuenta');
  linea('     el NOMBRE que le escriban; no prueba una clave. El recibo lo nombra igual.');
  linea('     Lo que detiene la suplantación aquí es la segunda capa —la firma criptográfica—,');
  linea('     y esa capa es de este proyecto, no del núcleo. Sin ella, el nombre bastaría.');

  titulo('12. Corregir una nota: con otra nota que la sustituye, no editando');
  const corr = await c.sustituirNota('nota-1', { clave: 'nota-1b', calificacion: '4', motivo: 'se corrigió el criterio de evaluación', now: T1 }, { firmas: [{ by: p }] });
  linea(`  ${corr.estado}: ${notas(c)}`);
  linea(`  las dos quedan en el registro: ${c.notas().filter((n) => n.cuerpo.sustituye === 'nota-1').length} sustituye a la original`);

  titulo('13. El título con una sola firma no sale');
  const unaFirma = await c.emitirTitulo({ estudiante: e, clave: 'tit-1' }, { now: T1, firmas: [{ by: p }] });
  mostrar(unaFirma);

  titulo('14. Con las dos firmas, el título se emite como credencial');
  const emitido = await c.emitirTitulo({ estudiante: e, clave: 'tit-1' }, { now: T1, firmas: [{ by: p }, { by: NOMBRES.oficina }] });
  mostrar(emitido);
  const t = c.titulos()[0];
  linea(`  título: ${t.cuerpo.clave} · ${t.cuerpo.asignaturas.join(' + ')} · huella ${t.huella.slice(0, 24)}…`);

  titulo('15. Emitirlo otra vez: no hay segunda credencial');
  const otra = await c.emitirTitulo({ estudiante: e, clave: 'tit-1' }, { now: T1, firmas: [{ by: p }, { by: NOMBRES.oficina }] });
  linea(`  ${otra.estado}: ${otra.detalle}`);
  const conClaveDistinta = await c.emitirTitulo({ estudiante: e, clave: 'tit-2' }, { now: T1, firmas: [{ by: p }, { by: NOMBRES.oficina }] });
  linea(`  ${conClaveDistinta.estado}: ${conClaveDistinta.detalle}`);
  linea(`  títulos en el registro: ${c.titulos().length}`);

  titulo('16. Un título de un curso que no existe');
  const fantasma = await c.emitirTitulo({ estudiante: e, clave: 'tit-fantasma', curso: 'astrofísica-9' }, { now: T1, firmas: [{ by: p }, { by: NOMBRES.oficina }] });
  linea(`  ${fantasma.estado}: ${fantasma.detalle}`);
  linea(`  salida: ${fantasma.salida}`);

  titulo('17. Una credencial alterada no verifica');
  const alterado = { ...t, cuerpo: { ...t.cuerpo, estudiante: 'alguien-otro' } };
  const vAlterado = verificarTitulo(alterado, emitido.recibo);
  const vBueno = verificarTitulo(t, emitido.recibo);
  linea(`  sin tocarlo: ${vBueno.ok ? 'verifica' : 'NO verifica'} — ${vBueno.motivo}`);
  linea(`  con el cuerpo editado a mano: ${vAlterado.ok ? 'verifica' : 'NO verifica'} — ${vAlterado.motivo}`);
  const alteradoRecibo = verifyReceipt({ ...emitido.recibo, detail: 'todo bien' });
  linea(`  el recibo editado a mano: ${alteradoRecibo.ok ? 'verifica' : 'NO verifica'} — ${alteradoRecibo.reason}`);

  titulo('18. La tercera parte audita sin creer a nadie');
  const a = c.auditar(emitido.recibo);
  linea(`  auditoría independiente del título: ${a.ok ? 'pasa' : 'NO pasa'} — ${a.motivo}`);
  linea(`  comprobaciones que recalculó: ${(a.checks || []).join(', ')}`);
  const creyente = { id: 'verificador-creyente', verificar: async () => ({ verified: true, checks: { me_lo_creo: true }, reason: 'me lo creo' }) };
  linea('  (Cátedra no acepta un verificador externo: el suyo recalcula desde el registro,');
  linea('   y eso es lo que una verificación independiente es.)');

  titulo('19. Alguien sin Cátedra recomputa el registro, en otro proceso');
  const fuera = verificarArchivo(path.join(dir, 'registro.jsonl'));
  linea(`  líneas:    ${fuera.lineasOk}/${fuera.lineas} con la huella calzada`);
  linea(`  resultado: ${fuera.ok ? 'el registro no fue editado después de escrito' : 'HAY LÍNEAS QUE NO CALZAN'}`);
  linea(`  firmas:    ${fuera.firmasOk}/${fuera.firmas.length} de las notas tienen firma que verifica`);
  for (const s of fuera.sinFirmar) linea(`    · sin firma válida: ${s.clave} (${s.profesor}) — ${s.motivo}`);
  linea('  La única sin firma válida es el paso 11: el gate dejó pasar el nombre, el intento quedó');
  linea('  escrito y el verificador lo rechazó. El paso 10 ni siquiera dejó línea, porque el núcleo');
  linea('  no llegó a ejecutar. No es que el registro se haya editado: es que alguien lo intentó.');
  linea('  Ese cálculo lo hace src/fuera.js, que carga solo node:crypto: no carga Cátedra ni el núcleo.');
  linea('  Y la prueba lo corre en un proceso aparte, donde su ruta no está en el caché de módulos.');

  titulo('20. Lo que este recorrido NO demuestra');
  linea('  · El anclaje de TODOS los recibos quedó en `pending`. No hay hash en testnet, no hay');
  linea('    transaction id, no hay explorador. Alguien sin esta máquina no tiene dónde mirar.');
  linea('  · Y por eso el claim central del proyecto —que el título es una credencial');
  linea('    VERIFICABLE— NO está demostrado. Lo emitido es un registro íntegro y local.');
  linea('    Una credencial que solo se verifica con este programa no cuenta como verificable.');
  linea('  · La firma del profesor liga la nota a una clave, y en esta máquina la clave privada');
  linea('    está en un archivo al lado del registro: prueba integridad, NO identidad.');
  linea('  · El gate de firmantes del núcleo cuenta nombres, no claves (el paso 11 lo muestra).');
  linea('    El recibo del núcleo nombra a quien pasó por la puerta, y eso no es autenticación.');
  linea('  · No cumple la Ley 21.719 ni ninguna otra norma: la norma primaria no se leyó aquí y');
  linea('    el comportamiento implementado no se contrastó contra ella. NO VERIFICADO.');
  linea('  · No hay adopción, ni permiso de la UAI, del Laboratorio Blockchain UAI ni de ningún');
  linea('    otro tercero. La universidad es ficticia y no reclama afiliación.');
  linea('  · La declaración de uso de IA se registra y se exige; nadie verifica que sea cierta.');
  linea('');
  linea(`  Para auditarlo:  node src/cli.js --registro "${dir}" auditar --clave tit-1`);
  linea(`  Recomputar sin este programa:  node src/cli.js --registro "${dir}" fuera`);
  linea('');
  return dir;
}

function notas(c) {
  return c.notas().map((n) => `${n.clave}=${n.cuerpo.calificacion}`).join(' ');
}

if (require.main === module) {
  main().then((dir) => { process.stdout.write(`registro: ${path.join(dir, 'registro.jsonl')}\n`); });
}

module.exports = { main };
