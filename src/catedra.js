'use strict';

// Cátedra — proyecto 5 de los diez de Vespi: la universidad.
//
// Este archivo es la carrocería; el núcleo ejecutable es el kernel de Vespi, que
// este proyecto consume sin modificar. La puerta de firmantes, el predicado de
// suficiencia, el reloj de los permisos y el sello del recibo son del núcleo. Lo
// que el núcleo no expresa y Cátedra agrega son las tres cosas que hacen que una
// universidad sea una institución y no una planilla: la convocatoria como acuerdo
// con reloj, la firma del profesor como llave y no como nombre, y el título como
// credencial que se puede volver a calcular sin este programa.
//
// Y lo que Cátedra no puede dar, y por lo tanto declara en cada salida: la
// credencial no es verificable afuera, porque el anclaje quedó en `pending`.

const fs = require('node:fs');
const path = require('node:path');
const { createHash, generateKeyPairSync, sign, verify } = require('node:crypto');

// El núcleo se carga desde la copia vendorizada que Lore Plugin instala en los
// hosts, no desde el árbol de desarrollo: esa copia está fijada al corte y sus
// bytes están declarados en su `SOURCE.md`, mientras el árbol de desarrollo avanza.
// `test/kernel.test.js` verifica esas huellas, así que si el corte se mueve,
// esta suite lo dice en vez de seguir corriendo en silencio.
const KERNEL = '../vendor/vespi-kernel';

const { sufficient } = require(`${KERNEL}/authority.js`);
const { createOperation, runOperation, STATES } = require(`${KERNEL}/operation.js`);
const { verifyReceipt } = require(`${KERNEL}/receipt.js`);

const REGISTRO = 'registro.jsonl';
const CLAVES = 'claves';

// Los nombres de la universidad de ejemplo. Son de fantasía y no representan a
// ninguna institución (decisiones 8, 29 y 30).
const NOMBRES = {
  estudiante: 'Rocío Mentís',
  profesor: 'Aurelio Sanz',
  profesorB: 'Nadia Ferreiro',
  oficina: 'Oficina de Títulos',
};

// Las cuatro comprobaciones que el verificador independiente tiene que recalcular
// desde el registro. Un verificador que no produce exactamente este conjunto no
// verificó nada.
const CHECKS_INDEPENDIENTES = [
  'matricula-en-registro',
  'entrega-declarada',
  'firma-valida',
  'expediente-completo',
];

const SALIDA = 'vuelve a la secretaria: abre la convocatoria o deja la gestión anotada como pendiente';

function texto(value) {
  return typeof value === 'string' && value.length > 0;
}

// El canon es el del núcleo: claves ordenadas, recursivo, sin transformation.
// Que sea el mismo importa, porque es lo que permite que alguien sin este
// programa vuelva a calcular el digest del recibo.
function canonico(value) {
  if (Array.isArray(value)) return value.map(canonico);
  if (value !== null && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = canonico(value[key]);
    return out;
  }
  return value;
}

function huellaDe(value) {
  return createHash('sha256').update(JSON.stringify(canonico(value)), 'utf8').digest('hex');
}

function sinHuella(linea) {
  const copia = { ...linea };
  delete copia.huella;
  return copia;
}

// El cuerpo firmado es la parte del documento que la firma ata. La clave pública
// y la firma van fuera del cuerpo justamente para que firmarlas no cambie lo
// firmado: si entraran, la firma alteraría el digest que ella misma produce.
function cuerpoFirmable(cuerpo) {
  const copia = { ...cuerpo };
  delete copia.firma;
  return copia;
}

function iso(now) {
  if (now === undefined || now === null) return new Date().toISOString();
  const ms = Date.parse(now);
  return Number.isNaN(ms) ? new Date().toISOString() : new Date(ms).toISOString();
}

function esInstante(now) {
  return texto(now) && !Number.isNaN(Date.parse(now));
}

class Catedra {
  constructor({ dir } = {}) {
    this.dir = dir;
    this.ruta = path.join(dir, REGISTRO);
    this.dirClaves = path.join(dir, CLAVES);
    fs.mkdirSync(this.dir, { recursive: true });
    fs.mkdirSync(this.dirClaves, { recursive: true });
    if (!fs.existsSync(this.ruta)) fs.writeFileSync(this.ruta, '', 'utf8');
  }

  // --- El registro: un archivo que se abre con cualquier editor ---

  leer() {
    const crudo = fs.readFileSync(this.ruta, 'utf8');
    return crudo.split('\n').filter((l) => l.trim().length > 0).map((l) => JSON.parse(l));
  }

  // La huella de una línea se calcula sobre su `cuerpo` cuando lo tiene, y
  // sobre el resto de la línea —sin la huella— cuando no. La convención está
  // escrita en un solo lugar porque el verificador de fuera la repite: si
  // divergieran, el registro «verificable sin el programa» no lo sería.
  escribir(linea) {
    const objetivo = linea.cuerpo !== undefined && linea.cuerpo !== null ? linea.cuerpo : sinHuella(linea);
    const conHuella = { ...linea, huella: huellaDe(objetivo) };
    fs.appendFileSync(this.ruta, `${JSON.stringify(conHuella)}\n`, 'utf8');
    return conHuella;
  }

  lineas(tipo) {
    return this.leer().filter((l) => l.tipo === tipo);
  }

  asignaturas() {
    return this.lineas('asignatura');
  }

  matriculas() {
    return this.soloVerificadas('matricula');
  }

  entregas() {
    return this.soloVerificadas('entrega');
  }

  notas() {
    return this.soloVerificadas('nota');
  }

  titulos() {
    return this.soloVerificadas('titulo');
  }

  // Un intento queda escrito aunque el verificador lo rechace: el rastro de lo
  // que alguien intentó hacer es parte del registro, y borrarlo sería quitar la
  // evidencia de un intento. Lo que no cuenta como hecho es lo que no pasó la
  // verificación, y por eso los lectores de arriba filtran por esto.
  //
  // Y el filtro no puede usarse para comprobar: un check que se lee a sí mismo
  // a través del filtro no puede pasar nunca. Los checks miran `lineaDe`, que
  // lee la línea cruda.
  intentos(tipo) {
    return this.lineas(tipo);
  }

  lineaDe(tipo, clave) {
    return this.lineas(tipo).find((l) => l.clave === clave) || null;
  }

  soloVerificadas(tipo) {
    return this.lineas(tipo).filter((l) => this.paso(l.clave));
  }

  paso(clave) {
    return CHECKS_INDEPENDIENTES.every((k) => this.comprobacionDe(clave)[k] === true);
  }

  recibos() {
    return this.lineas('recibo');
  }

  // La anotación de comprobación de un hecho: vive aparte del hecho, porque el
  // hecho escrito no se vuelve a tocar.
  comprobacionDe(clave) {
    const todas = this.lineas('comprobacion').filter((l) => l.clave === clave);
    return todas.length > 0 ? todas[todas.length - 1].checks : {};
  }

  publicKeys() {
    const lineas = this.lineas('publickey');
    const out = {};
    for (const l of lineas) out[l.nombre] = l.publicKey;
    return out;
  }

  // --- La ceremonia de llaves ---
  //
  // En una institución real el profesor custodia su clave privada y la
  // institución publica solo la pública. Aquí la privada queda en un archivo
  // aparte, dentro del mismo proyecto, y eso es un límite declarado: la firma
  // compra integridad del contenido, no identidad del firmante.
  ceremoniaDeLlaves(personas) {
    const hechas = [];
    for (const persona of personas) {
      const { publicKey, privateKey } = generateKeyPairSync('ed25519');
      const publica = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
      const privada = privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64');
      fs.writeFileSync(
        path.join(this.dirClaves, `${persona.nombre}.clave.json`),
        JSON.stringify({ nombre: persona.nombre, rol: persona.rol, privada }, null, 2),
        'utf8',
      );
      const linea = this.escribir({
        tipo: 'publickey',
        nombre: persona.nombre,
        rol: persona.rol,
        publicKey: publica,
        creada: iso(),
      });
      hechas.push(linea);
    }
    return hechas;
  }

  // Lo que haría el profesor con SU clave. Que en esta máquina cualquiera pueda
  // invocarlo es exactamente el límite del nivel 2, y por eso el recorrido y el
  // readme lo dicen.
  firmarCon(nombre, cuerpo) {
    const archivo = path.join(this.dirClaves, `${nombre}.clave.json`);
    if (!fs.existsSync(archivo)) return null;
    const { privada } = JSON.parse(fs.readFileSync(archivo, 'utf8'));
    const clave = require('node:crypto').createPrivateKey({
      key: Buffer.from(privada, 'base64'),
      format: 'der',
      type: 'pkcs8',
    });
    return sign(null, Buffer.from(JSON.stringify(canonico(cuerpo)), 'utf8'), clave).toString('base64');
  }

  comprobarFirma(nombre, cuerpo, firma) {
    const publica = this.publicKeys()[nombre];
    if (!publicKeysValida(publica) || !texto(firma)) return false;
    const clave = require('node:crypto').createPublicKey({
      key: Buffer.from(publica, 'base64'),
      format: 'der',
      type: 'spki',
    });
    try {
      return verify(null, Buffer.from(JSON.stringify(canonico(cuerpo)), 'utf8'), clave, Buffer.from(firma, 'base64'));
    } catch {
      return false;
    }
  }

  // --- El catálogo y la convocatoria ---

  crearAsignatura(spec = {}) {
    const { id, nombre, profesor, creditos, abre, cierra } = spec;
    for (const campo of ['id', 'nombre', 'profesor', 'abre', 'cierra']) {
      if (!texto(spec[campo])) throw new Error(`una asignatura necesita ${campo}`);
    }
    if (!esInstante(spec.abre) || !esInstante(spec.cierra)) throw new Error('la convocatoria necesita dos horas');
    if (Date.parse(spec.cierra) <= Date.parse(spec.abre)) throw new Error('la convocatoria cierra antes de abrir');
    if (this.asignaturas().some((a) => a.cuerpo.id === id)) throw new Error(`ya existe la asignatura ${id}`);
    return this.escribir({
      tipo: 'asignatura',
      id,
      cuerpo: {
        id,
        nombre,
        profesor,
        creditos: creditos || null,
        abre: iso(spec.abre),
        cierra: iso(spec.cierra),
        creada: iso(),
      },
    });
  }

  asignaturaDe(id) {
    return this.asignaturas().find((a) => a.cuerpo.id === id) || null;
  }

  // --- La puerta: el acuerdo en vigor ---
  //
  // El reloj del grant (el cierre) lo aplica el núcleo por su cuenta: cuando la
  // convocatoria venció, el predicado de suficiencia lo dice. La apertura no la
  // puede expresar un grant —un permiso tiene un final, no un principio—, así que
  // esa mitad la comprueba Cátedra y lo declara.
  enVigor(asignatura, now) {
    if (!asignatura) return { ok: false, motivo: 'no hay una asignatura con ese identificador en el catálogo', salida: SALIDA };
    const ahora = esInstante(now) ? Date.parse(now) : Date.now();
    if (ahora < Date.parse(asignatura.cuerpo.abre)) {
      return {
        ok: false,
        motivo: `la convocatoria de ${asignatura.cuerpo.id} aún no abre: abre el ${asignatura.cuerpo.abre}`,
        salida: `vuelve a la secretaria y espera a que abra el ${asignatura.cuerpo.abre}`,
      };
    }
    if (ahora >= Date.parse(asignatura.cuerpo.cierra)) {
      return {
        ok: false,
        motivo: `la convocatoria de ${asignatura.cuerpo.id} no está en vigor: cerró el ${asignatura.cuerpo.cierra}`,
        salida: `vuelve a la secretaria y abre la convocatoria de ${asignatura.cuerpo.id} para el período siguiente`,
      };
    }
    return { ok: true, asignatura };
  }

  // --- Matricular ---

  async matricular(peticion, opciones = {}) {
    const asignatura = this.asignaturaDe(peticion.asignatura);
    const prev = this.matriculas().find((m) => m.clave === peticion.clave);
    if (prev) return { estado: 'repetido', detalle: `la matrícula ${peticion.clave} ya existe`, salida: 'nada que hacer', recibo: prev.recibo || null };
    const vigente = this.enVigor(asignatura, opciones.now);
    const autoridad = vigente.ok
      ? { spend: [{ asset: 'accion:matricular', maxAmount: '1', to: `asignatura:${peticion.asignatura}`, expiresAt: asignatura.cuerpo.cierra }] }
      : { spend: [] };
    const op = createOperation({
      goal: `${peticion.estudiante} se matricula en ${peticion.asignatura}`,
      action: 'catedra:matricular',
      agent: 'catedra',
      exit: vigente.ok ? null : vigente.salida,
      authority: autoridad,
    });
    return this.correr(op, {
      clave: peticion.clave,
      tipo: 'matricula',
      capacidad: 'catedra:matricular',
      required() { return vigente.ok ? { spend: [{ asset: 'accion:matricular', amount: '1', to: `asignatura:${peticion.asignatura}` }] } : { impossible: true, reason: vigente.motivo, exit: vigente.salida }; },
      cuerpo: () => ({
        clave: peticion.clave,
        estudiante: peticion.estudiante,
        asignatura: peticion.asignatura,
        convocatoria: asignatura ? { abre: asignatura.cuerpo.abre, cierra: asignatura.cuerpo.cierra } : null,
        en: iso(opciones.now),
      }),
      checks: () => this.checksMatricula(peticion),
      verificador: opciones.verificador,
    }, opciones);
  }

  checksMatricula(peticion) {
    const fila = this.lineaDe('matricula', peticion.clave);
    return {
      'matricula-en-registro': fila !== null && fila.huella === huellaDe(fila.cuerpo),
      'entrega-declarada': this.intentos('entrega').filter((e) => e.cuerpo.estudiante === peticion.estudiante && e.cuerpo.asignatura === peticion.asignatura).length === 0,
      'firma-valida': true,
      'expediente-completo': true,
    };
  }

  // --- Entregar, declarando el uso de IA ---

  async entregar(peticion, opciones = {}) {
    const prev = this.entregas().find((e) => e.clave === peticion.clave);
    if (prev) return { estado: 'repetido', detalle: `la entrega ${peticion.clave} ya existe`, salida: 'nada que hacer', recibo: prev.recibo || null };
    const matricula = this.matriculas().find(
      (m) => m.cuerpo.estudiante === peticion.estudiante && m.cuerpo.asignatura === peticion.asignatura,
    );
    const falta = this.faltaDeDeclaracion(peticion.usoIA);
    let puerta;
    if (!matricula) {
      puerta = { ok: false, motivo: `no hay matrícula de ${peticion.estudiante} en ${peticion.asignatura}`, salida: 'vuelve a la estudiante: primero se matricula' };
    } else if (falta) {
      puerta = { ok: false, motivo: `falta la declaración de uso de IA: ${falta}`, salida: 'vuelve a la estudiante: declara qué IA usó y en qué proporción' };
    } else {
      puerta = { ok: true };
    }
    const autoridad = puerta.ok
      ? { spend: [{ asset: 'accion:entregar', maxAmount: '1', to: `asignatura:${peticion.asignatura}` }] }
      : { spend: [] };
    const op = createOperation({
      goal: `${peticion.estudiante} entrega un trabajo en ${peticion.asignatura}`,
      action: 'catedra:entregar',
      agent: 'catedra',
      exit: puerta.ok ? null : puerta.salida,
      authority: autoridad,
    });
    return this.correr(op, {
      clave: peticion.clave,
      tipo: 'entrega',
      capacidad: 'catedra:entregar',
      required() { return puerta.ok ? { spend: [{ asset: 'accion:entregar', amount: '1', to: `asignatura:${peticion.asignatura}` }] } : { impossible: true, reason: puerta.motivo, exit: puerta.salida }; },
      cuerpo: () => ({
        clave: peticion.clave,
        estudiante: peticion.estudiante,
        asignatura: peticion.asignatura,
        texto: texto(peticion.texto) ? peticion.texto : '',
        usoIA: {
          declarado: true,
          herramienta: peticion.usoIA.herramienta,
          proporcion: peticion.usoIA.proporcion,
          categoria: texto(peticion.usoIA.categoria) ? peticion.usoIA.categoria : 'sin declarar categoría',
        },
        en: iso(opciones.now),
      }),
      checks: () => this.checksEntrega(peticion),
      verificador: opciones.verificador,
    }, opciones);
  }

  // La declaración es obligatoria y tiene tres campos. La proporción se cuenta
  // entre 0 y 1 porque es una proporción, y porque una que se pasa de uno no
  // dice cuánto se usó sino que la caja no cierra.
  faltaDeDeclaracion(usoIA) {
    if (!usoIA || typeof usoIA !== 'object') return 'no hay declaración de uso de IA';
    if (usoIA.declarado !== true) return 'el trabajo no declara si usó IA';
    if (!texto(usoIA.herramienta)) return 'no dice qué herramienta usó';
    const p = usoIA.proporcion;
    if (typeof p !== 'number' || !Number.isFinite(p) || p < 0 || p > 1) return 'la proporción de uso de IA no es un número entre 0 y 1';
    return null;
  }

  checksEntrega(peticion) {
    const fila = this.lineaDe('entrega', peticion.clave);
    return {
      'matricula-en-registro': this.intentos('matricula').some((m) => m.cuerpo.estudiante === peticion.estudiante && m.cuerpo.asignatura === peticion.asignatura),
      'entrega-declarada': fila !== null && fila.huella === huellaDe(fila.cuerpo) && fila.cuerpo.usoIA.declarado === true,
      'firma-valida': true,
      'expediente-completo': true,
    };
  }

  // --- Firmar la nota ---
  //
  // Aquí el núcleo hace su parte sola: una autoridad con `signers` siempre se
  // pone a su gente, aunque el grant cubra el gasto, y el agente no cuenta como
  // firmante. Lo que Cátedra agrega es que el nombre no basta: sin la firma
  // criptográfica del profesor sobre el cuerpo de la nota, no hay nota.

  async firmarNota(peticion, opciones = {}) {
    const prev = this.notas().find((n) => n.clave === peticion.clave);
    if (prev) return { estado: 'repetido', detalle: `la nota ${peticion.clave} ya existe`, salida: 'nada que hacer', recibo: prev.recibo || null };
    const asignatura = this.asignaturaDe(peticion.asignatura);
    if (!asignatura) {
      return this.bloqueadoSinOperacion(`no hay una asignatura con ese identificador en el catálogo`, SALIDA);
    }
    const entrega = this.entregas().find(
      (e) => e.cuerpo.estudiante === peticion.estudiante && e.cuerpo.asignatura === peticion.asignatura,
    );
    if (!entrega) {
      return this.bloqueadoSinOperacion(`${peticion.estudiante} no entregó ningún trabajo en ${peticion.asignatura}`, 'vuelve a la estudiante y pide la entrega');
    }
    const profesor = asignatura.cuerpo.profesor;
    const autoridad = {
      spend: [{ asset: 'accion:notar', maxAmount: '1', to: `asignatura:${peticion.asignatura}` }],
      signers: { required: 1, allowed: [profesor] },
    };
    const op = createOperation({
      goal: `${profesor} firma la nota de ${peticion.estudiante} en ${peticion.asignatura}`,
      action: 'catedra:notar',
      agent: opciones.comoAgente || 'catedra',
      exit: `vuelve a ${profesor}: la nota necesita su firma`,
      authority: autoridad,
    });
    // El cuerpo se arma antes de la puerta para que la firma se pueda verificar
    // contra algo estable, y la firma se recalcula sobre ese mismo cuerpo.
    const cuerpo = {
      clave: peticion.clave,
      estudiante: peticion.estudiante,
      asignatura: peticion.asignatura,
      calificacion: peticion.calificacion,
      profesor,
      entrega: entrega.clave,
      sustituye: texto(peticion.sustituye) ? peticion.sustituye : null,
      motivo: texto(peticion.motivo) ? peticion.motivo : null,
      firmado_por: profesor,
      en: iso(opciones.now),
    };
    const firma = opciones.suplantarClave
      ? (opciones.suplantarClave === true ? null : opciones.suplantarClave)
      : this.firmarCon(profesor, cuerpoFirmable(cuerpo));
    const conFirma = { ...cuerpo, firma: { por: profesor, firma } };
    return this.correr(op, {
      clave: peticion.clave,
      tipo: 'nota',
      capacidad: 'catedra:notar',
      required() { return { spend: [{ asset: 'accion:notar', amount: '1', to: `asignatura:${peticion.asignatura}` }] }; },
      // `profesor` viaja en el plan, no solo en la puerta: es el nombre de quien
      // tiene que firmar, y lo necesitan tanto el mensaje de la nota como el
      // texto que la persona lee cuando la firma no verifica.
      profesor,
      firmante: profesor,
      cuerpo: () => conFirma,
      checks: () => this.checksNota(peticion, conFirma, profesor),
      verificador: opciones.verificador,
    }, opciones, { firmas: opciones.firmas, profesor });
  }

  checksNota(peticion, conFirma, profesor) {
    const fila = this.lineaDe('nota', peticion.clave);
    return {
      'matricula-en-registro': this.intentos('matricula').some((m) => m.cuerpo.estudiante === peticion.estudiante && m.cuerpo.asignatura === peticion.asignatura),
      'entrega-declarada': this.intentos('entrega').some((e) => e.cuerpo.estudiante === peticion.estudiante && e.cuerpo.asignatura === peticion.asignatura && e.cuerpo.usoIA.declarado === true),
      'firma-valida': fila !== null && this.comprobarFirma(profesor, cuerpoFirmable(conFirma), conFirma.firma.firma),
      'expediente-completo': fila !== null && fila.huella === huellaDe(fila.cuerpo),
    };
  }

  // La operación no existe. No es una comprobación que alguien pueda saltarse
  // con otro argumento: no hay puerta por la que pasar.
  editarNota() {
    throw new Error('una nota firmada no se edita: esa operación no existe en Cátedra. Para corregirla, emite otra que la sustituya con sustituirNota()');
  }

  async sustituirNota(claveOriginal, correccion, opciones = {}) {
    const original = this.notas().find((n) => n.clave === claveOriginal);
    if (!original) throw new Error(`no hay nota ${claveOriginal} que sustituir`);
    return this.firmarNota({
      clave: correccion.clave,
      estudiante: original.cuerpo.estudiante,
      asignatura: original.cuerpo.asignatura,
      calificacion: correccion.calificacion,
      sustituye: claveOriginal,
      motivo: correccion.motivo,
    }, { ...opciones, now: correccion.now });
  }

  // --- Emitir el título ---
  //
  // Dos firmas porque es la autoridad de varias partes: el profesor certifica el
  // expediente y la oficina lo otorga. Con una sola no sale, y eso lo decide el
  // núcleo contando identidades, no este proyecto.

  async emitirTitulo(peticion, opciones = {}) {
    // El curso se mira PRIMERO, y no por estética. El orden de estas cuatro
    // comprobaciones decide qué mensaje recibe quien cometió el error, y
    // contestarle «ya tienes el título» a alguien que pidió un curso que no
    // existe esconde el error real. Un pedido imposible se responde primero.
    if (texto(peticion.curso)) {
      const curso = this.asignaturaDe(peticion.curso);
      if (!curso) {
        return this.bloqueadoSinOperacion(`el curso ${peticion.curso} no existe: no está en el catálogo`, SALIDA);
      }
    }
    // El título repetido devuelve el recibo del primero, y ese recibo vive en
    // su propia línea del registro —no en la del título—, porque el efecto y lo
    // que el núcleo dijo de él son dos cosas y no una.
    const reciboDe = (clave) => {
      const linea = this.recibos().find((r) => r.clave === clave);
      return linea ? linea.recibo : null;
    };
    const prev = this.titulos().find((t) => t.cuerpo.clave === peticion.clave);
    if (prev) return { estado: 'repetido', detalle: `el título ${peticion.clave} ya existe`, salida: 'nada que hacer', recibo: reciboDe(prev.clave) };
    const yaEmitido = this.titulos().find((t) => t.cuerpo.estudiante === peticion.estudiante && t.cuerpo.programa === (peticion.programa || 'grado'));
    if (yaEmitido) {
      return { estado: 'repetido', detalle: `${peticion.estudiante} ya tiene el título ${yaEmitido.clave} emitido`, salida: 'nada que hacer', recibo: reciboDe(yaEmitido.clave) };
    }
    const matriculas = this.matriculas().filter((m) => m.cuerpo.estudiante === peticion.estudiante);
    if (matriculas.length === 0) {
      return this.bloqueadoSinOperacion(`no hay matrícula de ${peticion.estudiante} en ninguna asignatura`, 'vuelve a la secretaria: no hay expediente que otorgar');
    }
    if (texto(peticion.curso) && !matriculas.some((m) => m.cuerpo.asignatura === peticion.curso)) {
      return this.bloqueadoSinOperacion(`${peticion.estudiante} no está matriculada en ${peticion.curso}`, 'vuelve a la secretaria: el expediente no cubre ese curso');
    }
    // Dos firmas porque el título se otorga entre dos: el profesor certifica el
    // expediente y la oficina lo otorga. Es la autoridad de varias partes de la
    // decisión 31, y el número vive aquí y no repartido por el código.
    const required = 2;
    const authority = {
      spend: [{ asset: 'accion:otorgar', maxAmount: '1', to: `programa:${peticion.programa || 'grado'}` }],
      signers: { required, allowed: this.firmantesEsperados(matriculas) },
    };
    const op = createOperation({
      goal: `se otorga el título de ${peticion.estudiante}`,
      action: 'catedra:otorgar',
      agent: opciones.comoAgente || 'catedra',
      exit: 'vuelve a la oficina de títulos y al profesor: el título necesita las dos firmas',
      authority: authority,
    });
    const body = {
      clave: peticion.clave,
      estudiante: peticion.estudiante,
      programa: peticion.programa || 'grado',
      asignaturas: matriculas.map((m) => m.cuerpo.asignatura).sort(),
      notas: this.notas().filter((n) => n.cuerpo.estudiante === peticion.estudiante).map((n) => ({ clave: n.clave, calificacion: n.cuerpo.calificacion })).sort((a, b) => (a.clave < b.clave ? -1 : 1)),
      emitido: iso(opciones.now),
    };
    const cuerpo = { ...body, firma: { por: 'por-firma-de-cada-nota', firma: null } };
    return this.correr(op, {
      clave: peticion.clave,
      tipo: 'titulo',
      capacidad: 'catedra:otorgar',
      required() { return { spend: [{ asset: 'accion:otorgar', amount: '1', to: `programa:${peticion.programa || 'grado'}` }] }; },
      cuerpo: () => cuerpo,
      checks: () => this.checksTitulo(peticion, cuerpo),
      verificador: opciones.verificador,
    }, opciones);
  }

  firmantesEsperados(matriculas) {
    const profesores = matriculas
      .map((m) => this.asignaturaDe(m.cuerpo.asignatura))
      .filter(Boolean)
      .map((a) => a.cuerpo.profesor);
    return [...new Set([...profesores, NOMBRES.oficina])].sort();
  }

  checksTitulo(peticion, cuerpo) {
    const fila = this.lineaDe('titulo', peticion.clave);
    const delAlumno = (tipo) => this.intentos(tipo).filter((n) => n.cuerpo.estudiante === peticion.estudiante);
    const notas = delAlumno('nota').filter((n) => this.paso(n.clave));
    const entregas = delAlumno('entrega');
    return {
      'matricula-en-registro': fila !== null && fila.huella === huellaDe(fila.cuerpo),
      'entrega-declarada': entregas.length > 0 && entregas.every((e) => e.cuerpo.usoIA.declarado === true),
      // El título no lleva firma propia: la firma vive en cada nota, y el
      // verificador exige que estén todas las del expediente.
      'firma-valida': notas.length > 0 && notas.every((n) => this.comprobarFirma(n.cuerpo.profesor, cuerpoFirmable(n.cuerpo), n.cuerpo.firma && n.cuerpo.firma.firma)),
      'expediente-completo': fila !== null && cuerpo.asignaturas.every((id) => notas.some((n) => n.cuerpo.asignatura === id)),
    };
  }

  // --- El motor: una operación de Vespi por hecho ---

  // El bloqueo que se resuelve antes de abrir la operación —un curso que no
  // existe, alguien sin expediente— no es una operación: no hay permiso que
  // ejercitar. Se dice igual, con su salida, y sin escribir recibo falso.
  bloqueadoSinOperacion(motivo, salida) {
    return {
      estado: 'bloqueado',
      detalle: motivo,
      salida: salida || SALIDA,
      recibo: null,
    };
  }

  async correr(op, plan, opciones = {}, puerta = {}) {
    if (op.state === STATES.PAUSED) {
      return { estado: 'pausado', detalle: 'la operación está pausada', salida: 'reanuda o cancela', recibo: null };
    }
    const cap = {
      id: plan.capacidad,
      required: plan.required,
      perform: async () => {
        const cuerpo = plan.cuerpo();
        // El hecho se escribe primero y el verificador lo mira después: un
        // check calculado antes de escribir no podría estar mirando el
        // registro, y una verificación que no mira el registro no verifica.
        // La línea del hecho no se vuelve a tocar; los checks van en su propia
        // línea, como una anotación aparte.
        const linea = this.escribir({
          tipo: plan.tipo,
          clave: plan.clave,
          puerta: puerta.profesor || null,
          cuerpo,
        });
        this.escribir({
          tipo: 'comprobacion',
          clave: plan.clave,
          hecho: plan.tipo,
          checks: plan.checks(),
        });
        return {
          ok: true,
          evidence: { operationId: plan.clave, type: plan.tipo, status: 'escrito', code: linea.huella },
        };
      },
    };
    const io = {
      verify: async (evidencia) => {
        const checks = this.comprobacionDe(evidencia.operationId);
        const todas = CHECKS_INDEPENDIENTES.every((k) => checks[k] === true);
        return {
          verified: todas,
          checks,
          reason: todas
            ? 'recomputado desde el registro, sin creer el informe de quien lo ejecutó'
            : `el registro no sostiene ${CHECKS_INDEPENDIENTES.filter((k) => checks[k] !== true).join(', ')}`,
        };
      },
      ask: async () => {
        // La puerta del núcleo cuenta identidades nombradas. Devolver las firmas
        // sin nombre, o vacías, es lo que produce el "missing N approval".
        const firmas = Array.isArray(opciones.firmas) ? opciones.firmas : [];
        if (firmas.length === 0) return { approved: false, by: 'nadie' };
        return { approvals: firmas };
      },
    };
    const resultado = await runOperation(op, cap, io);
    const recibo = resultado.receipt;
    // El efecto y su recibo son dos líneas y no una: el efecto es lo que pasó y
    // no se reescribe; el recibo es lo que el núcleo dijo de él.
    if (recibo && recibo.status === 'verified') {
      this.escribir({ tipo: 'recibo', clave: plan.clave, tipoHecho: plan.tipo, recibo });
    }
    return this.traducir(resultado, op, plan);
  }

  traducir(resultado, op, plan) {
    const recibo = resultado.receipt;
    const estado = resultado.status;
    if (estado === 'verified') {
      return { estado: 'verificado', detalle: 'el hecho ocurrió dentro de la autoridad y el verificador lo recalculó desde el registro', salida: null, recibo };
    }
    if (estado === 'not_verified') {
      const checks = (recibo && recibo.verification && recibo.verification.checks) || {};
      const fallaFirma = checks['firma-valida'] === false;
      return {
        estado: fallaFirma ? 'sin_firma_valida' : 'no_verificado',
        detalle: fallaFirma
          ? `el gate contó a ${recibo.decidedBy || 'nadie'} y esa persona sí firma, pero no hay una firma criptográfica válida de ${plan.profesor || 'la persona que debe firmar'}: el nombre no es la firma`
          : (recibo && (recibo.detail || recibo.reason)) || 'no se pudo verificar el hecho',
        salida: `vuelve a ${plan.firmante || plan.profesor || 'quien debe firmar'} y firma con su clave`,
        recibo,
      };
    }
    if (estado === 'paused') return { estado: 'pausado', detalle: 'pausada', salida: 'reanuda o cancela', recibo: null };
    return {
      // `needs_human_decision` no es lo mismo que bloqueado: el núcleo está
      // pidiendo una firma, no diciendo que algo no se puede hacer. Quien lo
      // distinga son dos salidas distintas para la persona que lee.
      estado: estado === STATES.NEEDS_DECISION ? 'esperando' : 'bloqueado',
      detalle: (recibo && (recibo.detail || recibo.reason)) || 'no se pudo ejecutar',
      salida: (op && op.exit) || (recibo && recibo.exit) || SALIDA,
      recibo,
    };
  }

  // --- La auditoría: tercera parte, lee el registro y no cree a nadie ---

  auditar(recibo) {
    const sello = verifyReceipt(recibo);
    if (!sello.ok) return { ok: false, motivo: `el recibo no verifica: ${sello.reason}` };
    const clave = recibo.evidence && recibo.evidence.operationId;
    // Solo la línea del hecho: el comprobación y el recibo son anotaciones
    // sobre ese hecho, no el hecho. Contarlas como repeticiones haría que una
    // línea por hecho pareciera un registro con duplicados.
    const hechos = this.leer().filter((l) => l.clave === clave && l.tipo === (recibo.evidence && recibo.evidence.type));
    if (hechos.length === 0) return { ok: false, motivo: 'el recibo dice que hubo un hecho y el registro no lo tiene' };
    if (hechos.length > 1) return { ok: false, motivo: `el hecho ${clave} aparece ${hechos.length} veces en el registro` };
    const filas = hechos;
    if (filas[0].huella !== huellaDe(filas[0].cuerpo)) {
      return { ok: false, motivo: 'el hecho fue editado después de escrito: su huella ya no calza' };
    }
    const cubiertos = (recibo.coverage || []).filter((c) => CHECKS_INDEPENDIENTES.includes(c));
    const faltan = CHECKS_INDEPENDIENTES.filter((c) => !cubiertos.includes(c));
    if (faltan.length > 0) {
      return { ok: false, motivo: `el verificador creyó al ejecutor: no recalculó ${faltan.join(', ')} desde el registro`, checks: cubiertos };
    }
    const anclaje = recibo.anchor || { status: 'pending' };
    return {
      ok: true,
      motivo: 'el registro, la huella y el recibo dicen lo mismo',
      checks: cubiertos,
      anclaje,
      limite: anclaje.status === 'anchored'
        ? null
        : `el anclaje está en ${anclaje.status}: nada llegó a una red, así que NADIE sin este programa puede comprobar este recibo. Una credencial que solo se verifica aquí no cuenta como verificable.`,
    };
  }
}

function publicKeysValida(valor) {
  return typeof valor === 'string' && valor.length > 0;
}

module.exports = {
  Catedra,
  NOMBRES,
  CHECKS_INDEPENDIENTES,
  canonico,
  huellaDe,
  cuerpoFirmable,
  // Se reexportan por dos razones y las dos son para las pruebas: comparar lo
  // que este proyecto afirma contra lo que el núcleo realmente hace, y poder
  // limitar el RED a una sola dependencia en vez de importar dos veces.
  verifyReceipt,
  sufficient,
  createOperation,
  runOperation,
  nucleo: { verifyReceipt, sufficient, createOperation, runOperation },
};
