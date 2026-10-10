'use strict';

// La interfaz de Cátedra: una terminal que una persona opera sin saber nada
// del núcleo. Cada comando dice qué hizo, con qué autoridad, y qué puede hacer
// después — y, cuando toca, dice en la misma línea que nada llegó a la red.

const fs = require('node:fs');
const path = require('node:path');
const { Catedra, verifyReceipt } = require('./catedra.js');
const { verificarArchivo, verificarTitulo } = require('./fuera.js');

const AYUDA = `catedra — la universidad: matrícula, entregas con uso de IA declarado, notas firmadas
y títulos como credenciales

  catedra <comando> [--registro <carpeta>] [--clave valor ...]

  ceremonia   --gente "Nombre:rol, Nombre:rol"
  asignatura --id --nombre --profesor --creditos --abre --cierra
  matricular --estudiante --asignatura --clave [--ahora hora]
  entregar   --estudiante --asignatura --clave --texto --herramienta --proporcion [--categoria]
  notar      --estudiante --asignatura --clave --calificacion --firma Nombre
             [--como-agente Nombre] [--sin-clave]  (--sin-clave = escenario adversarial)
  corregir   --nota --clave --calificacion --motivo --firma Nombre
  titulo     --estudiante --clave [--curso id] --firma "A, B"
  asignaturas | matriculas | entregas | notas | titulos
  registro
  auditar    --clave
  verificar  --titulo clave
  fuera

Todos los datos son de ejemplo: no hay universidad real, ni red, ni blockchain,
ni pagos. Y nada de esto es una credencial verificable afuera.`;

function flags(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      out[key] = true;
    } else {
      out[key] = next;
      i += 1;
    }
  }
  return out;
}

function linea(texto = '') {
  process.stdout.write(`${texto}\n`);
}

function lista(nombres) {
  return typeof nombres === 'string' ? nombres.split(',').map((s) => s.trim()).filter(Boolean) : [];
}

function mostrar(r) {
  if (!r) return;
  linea(`  estado:   ${r.estado}`);
  if (r.detalle) linea(`  detalle:  ${r.detalle}`);
  if (r.salida) linea(`  salida:   ${r.salida}`);
  if (r.recibo) {
    linea(`  recibo:   ${r.recibo.status} · sello ${String(r.recibo.digest).slice(0, 16)}…`);
    if (r.recibo.decidedBy) linea(`  firmó:   ${r.recibo.decidedBy} (el nombre que pasó por la puerta)`);
    linea(`  anclaje:  ${r.recibo.anchor.status} en ${r.recibo.anchor.network}`);
    linea('  ── esto NO es verificable afuera: nada llegó a una red, no hay hash ni explorador.');
  }
}

function usoIADe(f) {
  if (f.sinDeclaracion) return { declarado: false };
  return {
    declarado: true,
    herramienta: f.herramienta,
    proporcion: Number(f.proporcion),
    categoria: f.categoria,
  };
}

// El comando es el primer argumento que no es bandera ni valor de bandera.
// Así `catedra --registro X auditar` y `catedra auditar --registro X` son la
// misma llamada: hacer fallar la segunda por un orden de palabras sería una
// forma de que el proyecto pareciera más difícil de operar de lo que es.
function comandoDe(argv) {
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const siguiente = argv[i + 1];
      if (siguiente !== undefined && !siguiente.startsWith('--')) i += 1;
      continue;
    }
    return token;
  }
  return null;
}

async function main(argv) {
  const f = flags(argv);
  const comando = comandoDe(argv);
  const dir = f.registro || path.join(__dirname, '..', 'datos');
  const c = new Catedra({ dir });

  if (!comando || f.ayuda || f.help) {
    linea(AYUDA);
    return 0;
  }

  if (comando === 'ceremonia') {
    const gente = lista(f.gente).map((par) => {
      const [nombre, rol] = par.split(':');
      return { nombre: (nombre || '').trim(), rol: (rol || 'sin rol').trim() };
    });
    if (gente.length === 0) {
      linea('ceremonia necesita --gente "Nombre:rol, Nombre:rol"');
      return 1;
    }
    const hechas = c.ceremoniaDeLlaves(gente);
    linea(`ceremonia de llaves: ${hechas.length} pares generados. La pública va al registro;`);
    linea('la privada queda en un archivo aparte DEL PROYECTO, que es el límite declarado:');
    linea('la firma prueba que la nota no cambió, no quién firmó.');
    for (const h of hechas) linea(`  ${h.nombre}  ${h.rol}`);
    return 0;
  }

  if (comando === 'asignatura') {
    const a = c.crearAsignatura({
      id: f.id, nombre: f.nombre, profesor: f.profesor,
      creditos: f.creditos, abre: f.abre, cierra: f.cierra,
    });
    linea(`asignatura ${a.cuerpo.id} creada — «${a.cuerpo.nombre}», ${a.cuerpo.creditos} créditos`);
    linea(`  imparte:  ${a.cuerpo.profesor}`);
    linea(`  en vigor:  ${a.cuerpo.abre} → ${a.cuerpo.cierra}`);
    linea('  fuera de esa ventana no hay matrícula: la convocatoria es el acuerdo.');
    return 0;
  }

  if (comando === 'matricular') {
    const r = await c.matricular({
      estudiante: f.estudiante, asignatura: f.asignatura, clave: f.clave,
    }, { now: f.ahora });
    linea(`matrícula «${f.clave}»: ${f.estudiante} en ${f.asignatura}`);
    mostrar(r);
    return r.estado === 'verificado' ? 0 : 1;
  }

  if (comando === 'entregar') {
    const r = await c.entregar({
      estudiante: f.estudiante, asignatura: f.asignatura, clave: f.clave,
      texto: f.texto, usoIA: usoIADe(f),
    }, { now: f.ahora });
    linea(`entrega «${f.clave}»: ${f.estudiante} en ${f.asignatura}`);
    const uso = usoIADe(f);
    // Se imprime lo que se declaró, y si no se declaró algo, se dice que eso es
    // lo que pasó. Imprimir «undefined, NaN %» sería mostrar que el comando no
    // miró lo que recibió.
    if (f.sinDeclaracion) {
      linea('  uso de IA: sin declarar (se pidió así)');
    } else if (typeof uso.herramienta !== 'string' || uso.herramienta.length === 0 || !Number.isFinite(uso.proporcion)) {
      linea('  uso de IA: NO declarado — falta --herramienta o --proporcion');
    } else {
      linea(`  uso de IA declarado: ${uso.herramienta}, ${(uso.proporcion * 100).toFixed(0)} %${uso.categoria ? `, ${uso.categoria}` : ''}`);
    }
    mostrar(r);
    return r.estado === 'verificado' ? 0 : 1;
  }

  if (comando === 'notar') {
    const firmas = lista(f.firma).map((by) => ({ by }));
    const r = await c.firmarNota({
      estudiante: f.estudiante, asignatura: f.asignatura,
      clave: f.clave, calificacion: f.calificacion,
    }, {
      now: f.ahora,
      firmas,
      comoAgente: f['como-agente'],
      // `--sin-clave` es el escenario adversarial: el nombre llega a la puerta y
      // el_gate lo cuenta, pero quien ejecuta no tiene la clave de quien debe
      // firmar. Es la forma de ver la segunda capa trabajando.
      suplantarClave: f['sin-clave'] ? true : undefined,
    });
    linea(`nota «${f.clave}»: ${f.calificacion} en ${f.asignatura} para ${f.estudiante}`);
    if (firmas.length === 0) linea('  sin firmas: el núcleo va a pedirla y no se escribe nada.');
    mostrar(r);
    if (r.estado === 'sin_firma_valida') {
      linea('  ── el gate contó el nombre, pero la firma criptográfica no verificó:');
      linea('     sin la clave de quien debe firmar, no hay nota.');
    } else if (r.estado === 'verificado') {
      linea('  ── la firma criptográfica verificó contra la clave registrada. Eso prueba que la');
      linea('     nota no cambió después de firmarse. NO prueba que quien firmó sea quien');
      linea('     dice ser: la clave privada de este proyecto está en un archivo al lado.');
    }
    return r.estado === 'verificado' ? 0 : 1;
  }

  if (comando === 'corregir') {
    const firmas = lista(f.firma).map((by) => ({ by }));
    const r = await c.sustituirNota(f.nota, {
      clave: f.clave, calificacion: f.calificacion,
      motivo: f.motivo, now: f.ahora,
    }, { firmas });
    linea(`corrección: ${f.nota} queda sustituida por ${f.clave} (${f.calificacion})`);
    linea('  motivo: ' + f.motivo);
    linea('  las dos notas quedan en el registro: una nota firmada no se borra, se sustituye.');
    mostrar(r);
    return r.estado === 'verificado' ? 0 : 1;
  }

  if (comando === 'titulo') {
    const firmas = lista(f.firma).map((by) => ({ by }));
    const r = await c.emitirTitulo({
      estudiante: f.estudiante, clave: f.clave, curso: f.curso, programa: f.programa,
    }, { now: f.ahora, firmas, comoAgente: f['como-agente'] });
    linea(`título «${f.clave}» para ${f.estudiante}`);
    linea('  exige dos firmas: el profesor certifica el expediente y la oficina lo otorga.');
    mostrar(r);
    if (r.estado === 'verificado') {
      linea('  ── el título está en el registro y su huella se puede recomputar sin este programa.');
      linea('     PERO su anclaje quedó en `pending`: nadie fuera de esta máquina lo puede comprobar.');
    }
    return r.estado === 'verificado' ? 0 : 1;
  }

  if (comando === 'asignaturas') {
    for (const a of c.asignaturas()) {
      linea(`${a.cuerpo.id}  ${a.cuerpo.nombre}  ${a.cuerpo.creditos} cr  ${a.cuerpo.profesor}  ${a.cuerpo.abre} → ${a.cuerpo.cierra}`);
    }
    return 0;
  }

  if (comando === 'matriculas' || comando === 'entregas' || comando === 'notas' || comando === 'titulos') {
    // El plural del comando es el singular del tipo, y los lectores de Cátedra
    // se llaman en plural. La tabla se escribe una vez para que un comando nuevo
    // no pueda caerse por una palabra mal puesta.
    const LECTORES = { matriculas: 'matriculas', entregas: 'entregas', notas: 'notas', titulos: 'titulos' };
    const TIPO = { matriculas: 'matricula', entregas: 'entrega', notas: 'nota', titulos: 'titulo' };
    const tipo = TIPO[comando];
    const filas = c[LECTORES[comando]]();
    for (const l of filas) {
      const b = l.cuerpo;
      if (tipo === 'matricula') linea(`${b.clave}  ${b.estudiante}  ${b.asignatura}`);
      if (tipo === 'entrega') linea(`${b.clave}  ${b.estudiante}  ${b.asignatura}  IA: ${b.usoIA.herramienta} ${(b.usoIA.proporcion * 100).toFixed(0)} %`);
      if (tipo === 'nota') linea(`${b.clave}  ${b.estudiante}  ${b.asignatura}  ${b.calificacion}  firmada por ${b.firmado_por}${b.sustituye ? `  (sustituye a ${b.sustituye})` : ''}`);
      if (tipo === 'titulo') linea(`${b.clave}  ${b.estudiante}  ${b.programa}  ${b.asignaturas.length} asignaturas  huella ${l.huella.slice(0, 16)}…`);
    }
    linea(`(${filas.length} verificados; los intentos que no pasaron la comprobación no se listan, pero siguen en el registro)`);
    return 0;
  }

  if (comando === 'registro') {
    linea(fs.readFileSync(path.join(dir, 'registro.jsonl'), 'utf8').trim());
    return 0;
  }

  if (comando === 'auditar') {
    const linea_ = c.recibos().find((r) => r.clave === f.clave);
    if (!linea_) {
      linea(`no hay recibo para la clave ${String(f.clave)}`);
      return 1;
    }
    const a = c.auditar(linea_.recibo);
    linea(`sello del recibo: ${verifyReceipt(linea_.recibo).ok ? 'verifica' : 'NO verifica'}`);
    linea(`auditoría independiente: ${a.ok ? 'pasa' : 'NO pasa'} — ${a.motivo}`);
    if (a.checks) linea(`  comprobaciones: ${a.checks.join(', ')}`);
    if (a.limite) {
      linea('  ── ' + a.limite);
    }
    return a.ok ? 0 : 1;
  }

  if (comando === 'verificar') {
    if (!f.titulo) {
      linea('verificar necesita --titulo <clave>');
      return 1;
    }
    const t = c.titulos().find((x) => x.clave === f.titulo);
    if (!t) {
      linea(`no hay título verificado con la clave ${String(f.titulo)}`);
      return 1;
    }
    const r = c.recibos().find((x) => x.clave === f.titulo);
    const v = verificarTitulo(t, r ? r.recibo : null);
    linea(v.ok ? `título ${f.titulo}: la huella calza` : `título ${f.titulo}: NO verifica`);
    linea(`  motivo:  ${v.motivo}`);
    linea(`  checks:  ${Object.keys(v.checks).map((k) => `${k}=${v.checks[k]}`).join(' · ')}`);
    linea(`  no comprueba: ${v.noComprueba}`);
    linea('  ── y el anclaje sigue en `pending`: esto no es una credencial verificable afuera.');
    return v.ok ? 0 : 1;
  }

  if (comando === 'fuera') {
    const v = verificarArchivo(path.join(dir, 'registro.jsonl'));
    linea('recomputado SIN cargar este programa (solo node:crypto):');
    linea(`  líneas:      ${v.lineasOk}/${v.lineas} con la huella calzada`);
    linea(`  resultado:   ${v.ok ? 'el registro no fue editado después de escrito' : 'HAY LÍNEAS QUE NO CALZAN'}`);
    for (const x of v.fallos) linea(`    · ${x.tipo} ${x.clave || ''}: ${x.motivo}`);
    linea(`  firmas:      ${v.firmasOk}/${v.firmas.length} de las notas tienen firma que verifica`);
    for (const s of v.sinFirmar) linea(`    · sin firma válida: ${s.clave} (${s.profesor})`);
    linea('');
    linea('lo que esto NO comprueba:');
    for (const x of v.noAlcanza) linea(`  · ${x}`);
    return v.ok ? 0 : 1;
  }

  linea(`comando desconocido: ${comando}`);
  linea(AYUDA);
  return 2;
}

module.exports = { main, AYUDA };

if (require.main === module) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; });
}
