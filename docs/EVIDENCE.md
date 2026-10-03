# Evidence

## Current result

The captured suite contains 35 tests: 34 pass, 1 fails, and 0 are skipped or marked TODO. The failing test is **“el núcleo que consume Cátedra es el corte fijado, módulo por módulo.”** Its `continuity.js` digest differs from the expected digest. This failure is the project's deliberate kernel pin: Cátedra was built on kernel cut `54c20c7`, while the installed kernel is now 0.1.3. The nine code projects were built on that 2026-09-29 cut and their own records report green suites there. Each pins the kernel digest it consumes and is meant to fail when that kernel moves. Re-pinning against the installed kernel and rerunning the suites remains pending. These results show a working path, not a finished product or readiness for use.

The captured suite output was supplied with the project materials. This public repository does not include the source code today, so the commands below apply once the code opens during the judges' review period.

## What the tests cover

### Enrollment and submissions

- `matricular fuera de la convocatoria vuelve bloqueado con la salida nombrada, y no escribe matrícula`
- `matricular antes de que abra la convocatoria también vuelve bloqueado, y dice por qué`
- `dentro de la convocatoria la matrícula sí pasa y deja recibo`
- `entregar sin declarar el uso de IA vuelve bloqueado, aunque la matrícula exista`
- `entregar sin el campo de uso de IA completo también vuelve bloqueado, y dice qué falta`
- `quien no está matriculado no puede entregar, aunque la convocatoria esté abierta`
- `la entrega con declaración guardada lleva la proporción y la herramienta en el registro`

These check enrollment timing, course-specific permission, and the required AI-use declaration. They do not check whether the declaration is true.

### Grades, approvals and corrections

- `sin que el profesor firme, la nota no se escribe y el núcleo pregunta`
- `con la firma del profesor la nota se escribe y nombra a quien firmó en el recibo`
- `otro profesor no puede firmar la nota de una asignatura que no imparte`
- `una nota firmada no se edita: la operación no existe`
- `corregir una nota firmada se hace con otra nota que la sustituye, y quedan las dos`
- `la estudiante no puede firmar su propia nota: el núcleo filtra al agente`
- `el gate del núcleo cuenta el nombre que le escriban, aunque no sea el profesor: por eso la firma es otra capa`

The last test records an important boundary: the kernel signer gate counts the name supplied at the gate. Cátedra's separate cryptographic signature check rejects an invalid signature, but the kernel receipt can still name the entered person. A name at that gate is not proof of identity.

### Degrees, receipts and independent verification

- `un título editado a mano no verifica, y dice que la huella ya no calza`
- `alterar la firma dentro del título tampoco verifica`
- `un recibo editado a mano no verifica con el núcleo`
- `emitir dos veces el mismo título no crea una segunda credencial`
- `una clave distinta tampoco duplica el título: la credencial es de la persona y el programa`
- `emitir un título de un curso que no existe vuelve bloqueado, y no escribe nada`
- `no se puede emitir un título de alguien que no está matriculado en nada`
- `el título exige dos firmas: con una sola no se emite`
- `la firma liga contenido y no identidad: con la clave al lado verifica integridad, y eso se declara`
- `la verificación fuera del medio corre en un proceso que no carga Cátedra`
- `un título repetido devuelve el recibo del primero, no uno nuevo`
- `el curso que no existe se responde antes que el título repetido`
- `un intento sin firma válida queda escrito pero no cuenta como nota`
- `la auditoría no cuenta el comprobación ni el recibo como repeticiones del hecho`
- `la verificación externa declara en su propio resultado lo que no alcanza`

These checks concern the local record, approval rules and verifier behavior. The title's anchor is `pending`; no testnet hash, transaction ID or public explorer entry exists. The tests therefore do not prove that a reader outside Cátedra can verify that a university issued the degree.

### Terminal and kernel pin

- `los cuatro comandos de listado de la terminal funcionan`
- `la terminal acepta las banderas antes o después del comando`
- `la terminal devuelve un código distinto de cero cuando el hecho no ocurrió`
- `el núcleo que consume Cátedra es el corte fijado, módulo por módulo`
- `el encabezado de los cinco módulos declara el mismo commit`
- `Cátedra carga el núcleo desde la copia vendorizada, no desde el árbol de desarrollo`

The first three check terminal behavior. The last three check the consumed kernel's identity and loading boundary; the digest test is the one currently failing after the installed kernel moved.

## Adversarial phase

The project agreement and `FASES.md` report that eight red tests were written before implementation and each was observed failing. The first honest failure was the missing module `../src/catedra.js`. The adversarial work also surfaced three findings beyond the original eight:

1. The kernel signer gate counts a supplied name rather than authenticating a key. The separate project signature layer rejects a bad cryptographic signature, but the kernel receipt still names the supplied person.
2. Grant timing uses the kernel's real clock. It does not accept an injected `now`, so the example enrollment dates move with the date on which the suite runs.
3. A rejected attempt remains in the record. It is reported as an unsigned attempt rather than being erased, preserving evidence that it happened.

The sources report a complete 20-step terminal walkthrough that ends on the limits screen. They also report a fresh-session run with the earlier pinned kernel and RC5 active on Claude Code, Codex and OpenCode: 35/35 tests and 27 terminal commands without a crash. That is a historical run against the old pin, not the result against today's installed kernel.

## How to rerun after code opens

From the project root, run `npm test` to reproduce the suite and `node src/recorrido.js` to run the documented walkthrough. The source package also defines `npm run recorrido`, `npm run cli`, and `npm run fuera`. Before expecting a green suite against the installed kernel, the project must be explicitly re-pinned and the suite rerun; the project intentionally does not accept a moving kernel silently. The code release is planned for the judges' review period under the review-only license.

No testnet transaction evidence is claimed for Cátedra. Its agreement says there is no blockchain, payment, testnet anchor, transaction ID or explorer entry.

---

# Evidencia

## Resultado actual

La suite capturada contiene 35 pruebas: 34 pasan, 1 falla y 0 están omitidas o marcadas como pendientes. La prueba que falla es **«el núcleo que consume Cátedra es el corte fijado, módulo por módulo»**. El digest de `continuity.js` no coincide con el esperado. Este fallo es la fijación deliberada del kernel: Cátedra se construyó sobre el corte `54c20c7`, mientras que el kernel instalado ahora es 0.1.3. Los nueve proyectos con código se construyeron contra ese corte del 2026-09-29 y sus propios registros informan suites verdes allí. Cada uno fija el digest del kernel que consume y debe fallar cuando ese kernel se mueve. Volver a fijar contra el kernel instalado y correr las suites está pendiente. Estos resultados muestran un recorrido que funciona, no un producto terminado ni listo para usarse.

La salida capturada de la suite se entregó junto con los materiales del proyecto. Este repositorio público no incluye hoy el código, por lo que los comandos siguientes aplican cuando se abra durante el periodo de revisión de los jueces.

## Qué cubren las pruebas

### Matrícula y entregas

- `matricular fuera de la convocatoria vuelve bloqueado con la salida nombrada, y no escribe matrícula`
- `matricular antes de que abra la convocatoria también vuelve bloqueado, y dice por qué`
- `dentro de la convocatoria la matrícula sí pasa y deja recibo`
- `entregar sin declarar el uso de IA vuelve bloqueado, aunque la matrícula exista`
- `entregar sin el campo de uso de IA completo también vuelve bloqueado, y dice qué falta`
- `quien no está matriculado no puede entregar, aunque la convocatoria esté abierta`
- `la entrega con declaración guardada lleva la proporción y la herramienta en el registro`

Comprueban el momento de la matrícula, los permisos por asignatura y la declaración de uso de IA requerida. No verifican si la declaración es cierta.

### Notas, aprobaciones y correcciones

- `sin que el profesor firme, la nota no se escribe y el núcleo pregunta`
- `con la firma del profesor la nota se escribe y nombra a quien firmó en el recibo`
- `otro profesor no puede firmar la nota de una asignatura que no imparte`
- `una nota firmada no se edita: la operación no existe`
- `corregir una nota firmada se hace con otra nota que la sustituye, y quedan las dos`
- `la estudiante no puede firmar su propia nota: el núcleo filtra al agente`
- `el gate del núcleo cuenta el nombre que le escriban, aunque no sea el profesor: por eso la firma es otra capa`

La última prueba deja constancia de un límite importante: la compuerta de firmantes del kernel cuenta el nombre suministrado. La comprobación criptográfica separada de Cátedra rechaza una firma inválida, pero el recibo del kernel puede conservar el nombre ingresado. Un nombre en esa compuerta no demuestra identidad.

### Títulos, recibos y verificación independiente

- `un título editado a mano no verifica, y dice que la huella ya no calza`
- `alterar la firma dentro del título tampoco verifica`
- `un recibo editado a mano no verifica con el núcleo`
- `emitir dos veces el mismo título no crea una segunda credencial`
- `una clave distinta tampoco duplica el título: la credencial es de la persona y el programa`
- `emitir un título de un curso que no existe vuelve bloqueado, y no escribe nada`
- `no se puede emitir un título de alguien que no está matriculado en nada`
- `el título exige dos firmas: con una sola no se emite`
- `la firma liga contenido y no identidad: con la clave al lado verifica integridad, y eso se declara`
- `la verificación fuera del medio corre en un proceso que no carga Cátedra`
- `un título repetido devuelve el recibo del primero, no uno nuevo`
- `el curso que no existe se responde antes que el título repetido`
- `un intento sin firma válida queda escrito pero no cuenta como nota`
- `la auditoría no cuenta el comprobación ni el recibo como repeticiones del hecho`
- `la verificación externa declara en su propio resultado lo que no alcanza`

Estas pruebas tratan el registro local, las reglas de aprobación y el comportamiento del verificador. El anclaje del título está en `pending`; no existe hash de testnet, identificador de transacción ni entrada en un explorador público. Por eso las pruebas no demuestran que alguien ajeno a Cátedra pueda verificar que una universidad emitió el título.

### Terminal y fijación del kernel

- `los cuatro comandos de listado de la terminal funcionan`
- `la terminal acepta las banderas antes o después del comando`
- `la terminal devuelve un código distinto de cero cuando el hecho no ocurrió`
- `el núcleo que consume Cátedra es el corte fijado, módulo por módulo`
- `el encabezado de los cinco módulos declara el mismo commit`
- `Cátedra carga el núcleo desde la copia vendorizada, no desde el árbol de desarrollo`

Las primeras tres comprueban la terminal. Las tres últimas comprueban la identidad y frontera de carga del kernel consumido; el test de digest es el que falla ahora que el kernel instalado se movió.

## Fase adversarial

El acuerdo y `FASES.md` informan que ocho pruebas rojas se escribieron antes de implementar y se observó fallar cada una. El primer fallo honesto fue que faltaba el módulo `../src/catedra.js`. El trabajo adversarial también encontró tres cosas más allá de las ocho pruebas originales:

1. La compuerta de firmantes del kernel cuenta un nombre ingresado en vez de autenticar una clave. La capa de firma del proyecto rechaza una firma criptográfica inválida, pero el recibo del kernel conserva el nombre suministrado.
2. El reloj de la autoridad usa el reloj real del kernel. No acepta un `now` inyectado, así que las fechas de ejemplo para matricularse cambian según el día en que corre la suite.
3. Un intento rechazado permanece en el registro. Se informa como intento sin firma en vez de borrarlo, conservando evidencia de que ocurrió.

Las fuentes informan un recorrido completo de terminal de 20 pasos que termina en la pantalla de límites. También registran una corrida en sesión fresca con el kernel fijado anterior y RC5 activa en Claude Code, Codex y OpenCode: 35/35 pruebas y 27 comandos de terminal sin fallos. Esa corrida histórica corresponde a la fijación anterior, no al resultado contra el kernel instalado hoy.

## Cómo volver a correrlas cuando se abra el código

Desde la raíz del proyecto, ejecuta `npm test` para repetir la suite y `node src/recorrido.js` para ejecutar el recorrido documentado. El paquete fuente también define `npm run recorrido`, `npm run cli` y `npm run fuera`. Antes de esperar una suite verde contra el kernel instalado, se debe volver a fijar el kernel de forma explícita y correr de nuevo la suite; el proyecto no acepta silenciosamente que el kernel se mueva. El código se abrirá durante el periodo de revisión de los jueces bajo la licencia de solo revisión.

No se reclama evidencia de transacciones de testnet para Cátedra. Su acuerdo dice que no hay blockchain, pagos, anclaje a testnet, identificador de transacción ni explorador.
