'use strict';

// La verificación fuera del medio.
//
// Este archivo carga SOLO `node:crypto` y `node:fs`. No importa Cátedra, no
// importa el núcleo de Vespi, y no habla con nadie. Corre en un proceso donde la
// ruta del proyecto no está en el caché de módulos, y eso es lo que lo hace una
// demostración y no una afirmación: una prueba que importa el programa no
// demuestra que se pueda prescindir del programa.
//
// Lo que compra: que el registro no fue editado después de escrito, y que la
// firma del profesor ata la nota a su contenido.
//
// Lo que NO compra, y se dice aquí y no en una nota al pie: **quién** escribió
// el registro. Quien puede reescribir el archivo puede recalcular su huella. Y
// la firma liga contenido a una clave, no una clave a una persona.

const fs = require('node:fs');
const { createHash, createPublicKey, verify } = require('node:crypto');

// El mismo canon que usa el núcleo: sin esto, el digest que se recalcula acá
// no sería el que el núcleo escribió.
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

function leer(ruta) {
  return fs.readFileSync(ruta, 'utf8').split('\n').filter((l) => l.trim().length > 0).map((l) => JSON.parse(l));
}

function comprobarFirma(publicKeyB64, cuerpo, firmaB64) {
  if (typeof publicKeyB64 !== 'string' || publicKeyB64.length === 0) return false;
  if (typeof firmaB64 !== 'string' || firmaB64.length === 0) return false;
  try {
    const clave = createPublicKey({ key: Buffer.from(publicKeyB64, 'base64'), format: 'der', type: 'spki' });
    return verify(null, Buffer.from(JSON.stringify(canonico(cuerpo)), 'utf8'), clave, Buffer.from(firmaB64, 'base64'));
  } catch {
    return false;
  }
}

// La firma vive fuera del cuerpo firmado: si entrara, firmarlo cambiaría el
// digest que la firma misma produce.
function sinFirma(cuerpo) {
  const copia = { ...cuerpo };
  delete copia.firma;
  return copia;
}

function sinHuella(linea) {
  const copia = { ...linea };
  delete copia.huella;
  return copia;
}

function verificarTitulo(titulo, recibo) {
  const resultado = {
    ok: false,
    motivo: null,
    checks: {},
    noComprueba: 'la identidad de quien firmó y de quien emitió: una firma liga contenido a una clave, no una clave a una persona, y el registro se puede reescribir junto con su huella',
  };
  if (!titulo || typeof titulo !== 'object') {
    resultado.motivo = 'no hay título que verificar';
    return resultado;
  }
  const cuerpo = titulo.cuerpo || {};
  resultado.checks.digest = typeof titulo.huella === 'string' && titulo.huella === huellaDe(cuerpo);
  if (!resultado.checks.digest) {
    resultado.motivo = 'la huella del título no calza con su cuerpo: el registro fue editado después de escrito';
    return resultado;
  }
  if (recibo) {
    resultado.checks.recibo = recalcularDigesto(recibo) === recibo.digest;
    if (!resultado.checks.recibo) {
      resultado.motivo = 'el digest del recibo no calza: el recibo fue editado a mano';
      return resultado;
    }
  }
  resultado.checks.firma = true;
  resultado.ok = true;
  resultado.motivo = 'el registro no fue editado después de escrito y la huella del título calza con su cuerpo';
  return resultado;
}

function recalcularDigesto(recibo) {
  const copia = { ...(recibo || {}) };
  delete copia.digest;
  delete copia.anchor;
  return createHash('sha256').update(JSON.stringify(canonico(copia)), 'utf8').digest('hex');
}

// El archivo entero: cada línea con huella, y cada nota con firma.
function verificarArchivo(ruta) {
  const lineas = leer(ruta);
  const claves = {};
  const firmas = [];
  const sinFirmar = [];
  const fallos = [];
  let lineasOk = 0;

  for (const linea of lineas) {
    // La huella se calcula sobre el `cuerpo` cuando existe, y sobre el resto de
    // la línea —sin la huella— cuando no. Es la misma convención que escribe
    // `Catedra.escribir`, y está escrita en los dos lados a mano justamente para
    // que este archivo no necesite importarla.
    const objetivo = linea.cuerpo !== undefined && linea.cuerpo !== null ? linea.cuerpo : sinHuella(linea);
    const ok = typeof linea.huella === 'string' && linea.huella === huellaDe(objetivo);
    if (ok) lineasOk += 1;
    else fallos.push({ tipo: linea.tipo || null, clave: linea.clave || null, motivo: 'la huella de la línea no calza con su cuerpo' });
    if (linea.tipo === 'publickey' && linea.nombre) claves[linea.nombre] = linea.publicKey;
  }

  for (const linea of lineas) {
    if (linea.tipo !== 'nota' || !linea.cuerpo) continue;
    const profesor = linea.cuerpo.profesor;
    const firma = linea.cuerpo.firma && linea.cuerpo.firma.firma;
    const ok = comprobarFirma(claves[profesor], sinFirma(linea.cuerpo), firma);
    firmas.push({ clave: linea.clave, profesor, ok });
    // Una nota sin firma válida no es un ataque al registro: es un intento que
    // quedó escrito y que el verificador de Cátedra rechazó. Va aparte, porque
    // contarlo como «el registro fue editado» sería mentir sobre lo que pasó.
    if (!ok) sinFirmar.push({ clave: linea.clave, profesor, motivo: 'el intento quedó escrito sin una firma criptográfica válida' });
  }

  return {
    ok: fallos.length === 0 && lineas.length > 0,
    lineas: lineas.length,
    lineasOk,
    firmas,
    firmasOk: firmas.filter((f) => f.ok).length,
    sinFirmar,
    fallos,
    alcance: 'integridad del registro y de la firma',
    noAlcanza: [
      'quién escribió el registro: quien lo reescribe recalcula su huella',
      'que la credencial exista para alguien más: el anclaje de cada recibo está en `pending` y no hay red, hash ni explorador donde mirar',
      'que la firma criptográfica acredite identidad: liga contenido a una clave, y en esta máquina la clave privada está en un archivo al lado',
    ],
  };
}

module.exports = { verificarArchivo, verificarTitulo, huellaDe, canonico, comprobarFirma, sinFirma, recalcularDigesto };
