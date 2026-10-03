# Evidence

This page separates the captured result from historical runs and from claims the tests cannot establish. The test names below are retained in Spanish as recorded by the suite.

## Captured suite

The captured run reports 35 tests: 34 pass, 1 fails, and none are skipped or marked TODO. The failure is `el núcleo que consume Cátedra es el corte fijado, módulo por módulo`. Its module-by-module digest check finds that `continuity.js` no longer matches the value Cátedra pinned. The agreement and phase record identify the pinned kernel cut as `54c20c7`; the installed kernel is now `0.1.3`. In the captured output, the actual digest is `073ecacdf099b0af53e49f3cecf1ba7e9e3ea910a4505ee422034857ac9d8d81` and the expected pinned digest is `ceba712aa3d9300a83382b90dd5ab97bb5809fe1a3f779c99f0984bf6305e73e`.

The failure is the explicit kernel pin detecting a changed dependency. It prevents the project from silently treating a different kernel as the reviewed one. Updating the pin requires an explicit decision and a new suite run; that work is pending. Until then, the captured result remains 34/35. This count is the current captured suite, not the historical green run described below.

## What the tests cover

### Enrollment and submissions

- `matricular fuera de la convocatoria vuelve bloqueado con la salida nombrada, y no escribe matrícula`
- `matricular antes de que abra la convocatoria también vuelve bloqueado, y dice por qué`
- `dentro de la convocatoria la matrícula sí pasa y deja recibo`
- `entregar sin declarar el uso de IA vuelve bloqueado, aunque la matrícula exista`
- `entregar sin el campo de uso de IA completo también vuelve bloqueado, y dice qué falta`
- `quien no está matriculado no puede entregar, aunque la convocatoria esté abierta`
- `la entrega con declaración guardada lleva la proporción y la herramienta en el registro`

These tests cover enrollment timing, course-specific permission, and the presence of the AI-use declaration. They do not determine whether a declaration is true.

### Grades, approvals, and corrections

- `sin que el profesor firme, la nota no se escribe y el núcleo pregunta`
- `con la firma del profesor la nota se escribe y nombra a quien firmó en el recibo`
- `otro profesor no puede firmar la nota de una asignatura que no imparte`
- `una nota firmada no se edita: la operación no existe`
- `corregir una nota firmada se hace con otra nota que la sustituye, y quedan las dos`
- `la estudiante no puede firmar su propia nota: el núcleo filtra al agente`
- `el gate del núcleo cuenta el nombre que le escriban, aunque no sea el profesor: por eso la firma es otra capa`

The last test records a boundary in the consumed kernel: its signer gate counts the supplied name. Cátedra's separate cryptographic layer rejects an invalid signature, but the kernel receipt may still retain the supplied name. A name at that gate is not proof of identity.

### Degrees, receipts, and independent verification

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

These tests check local record behavior, approval rules, repeat issuance, and the verifier's stated limits. They do not establish that a real university issued the degree. Its anchor remains `pending`; there is no testnet hash, transaction ID, or public explorer entry.

### Terminal and consumed kernel

- `los cuatro comandos de listado de la terminal funcionan`
- `la terminal acepta las banderas antes o después del comando`
- `la terminal devuelve un código distinto de cero cuando el hecho no ocurrió`
- `el núcleo que consume Cátedra es el corte fijado, módulo por módulo`
- `el encabezado de los cinco módulos declara el mismo commit`
- `Cátedra carga el núcleo desde la copia vendorizada, no desde el árbol de desarrollo`

The terminal tests cover listing behavior, flag placement, and nonzero status for a failed act. The kernel tests check the declared commit and that Cátedra loads its vendored copy. The first of those kernel checks is the captured failure described above.

## Adversarial findings

The project agreement and phase record say eight red tests were written before implementation and that each failure was observed. The first honest failure was the missing `../src/catedra.js` module. The adversarial work also surfaced three findings:

1. The kernel signer gate counts a name entered by the operator, not an authenticated key. Cátedra's cryptographic layer rejects an invalid signature, but the kernel receipt can still name the supplied person.
2. Grant timing uses the kernel's real clock. There is no injected `now`, so the example call dates move with the date on which the suite runs.
3. A rejected attempt remains in the record as an unsigned attempt. It is not erased, so the record preserves evidence that an attempt occurred.

## Walkthrough and prior run

The project materials report a complete 20-step terminal walkthrough that ends on a screen describing the limits. They also record a fresh-session run with the earlier pinned kernel and RC5 active on Claude Code, Codex, and OpenCode: 35/35 tests and 27 terminal commands without a crash. That is a historical run against the old pin. It is not the captured result against the currently installed kernel.

The source materials say the terminal walkthrough's lines come from a real execution. Its transcript is not included in this public repository, so the schematic dialogue in the README is not a quoted run or fabricated output.

## How to reproduce when source opens

The project package defines `npm test` for the test suite and `node src/recorrido.js` for the walkthrough. It also defines `npm run recorrido`, `npm run cli`, and `npm run fuera`. The source code is not included in this repository, so these commands cannot be run from this public copy today. Once the code is available, first review the pinned kernel change, then run the suite again. A green result against a new kernel requires an explicit re-pin and fresh test evidence.

No testnet transaction evidence is claimed. The project agreement says there is no blockchain, payment flow, testnet anchor, transaction ID, or explorer entry.

---

# Evidencia

Esta página separa el resultado capturado de las corridas históricas y de las afirmaciones que las pruebas no pueden establecer. Los nombres de prueba se conservan en español tal como aparecen en la suite.

## Suite capturada

La corrida capturada informa 35 pruebas: pasan 34, falla 1 y ninguna está omitida o marcada como TODO. La falla corresponde a `el núcleo que consume Cátedra es el corte fijado, módulo por módulo`. Su comprobación módulo por módulo detecta que `continuity.js` ya no coincide con el valor fijado por Cátedra. El acuerdo y las fases identifican el corte de kernel fijado como `54c20c7`; el kernel instalado ahora es `0.1.3`. En la salida capturada, el digest real es `073ecacdf099b0af53e49f3cecf1ba7e9e3ea910a4505ee422034857ac9d8d81` y el digest esperado al fijarlo es `ceba712aa3d9300a83382b90dd5ab97bb5809fe1a3f779c99f0984bf6305e73e`.

La falla es la fijación explícita del kernel al detectar un cambio en la dependencia. Evita que el proyecto trate en silencio otro kernel como si fuera el revisado. Actualizar la fijación requiere una decisión explícita y una nueva ejecución de la suite; ese trabajo sigue pendiente. Hasta entonces, el resultado capturado permanece en 34/35. Esta cifra corresponde a la suite capturada actual, no a la corrida histórica verde descrita más adelante.

## Qué cubren las pruebas

### Matrícula y entregas

- `matricular fuera de la convocatoria vuelve bloqueado con la salida nombrada, y no escribe matrícula`
- `matricular antes de que abra la convocatoria también vuelve bloqueado, y dice por qué`
- `dentro de la convocatoria la matrícula sí pasa y deja recibo`
- `entregar sin declarar el uso de IA vuelve bloqueado, aunque la matrícula exista`
- `entregar sin el campo de uso de IA completo también vuelve bloqueado, y dice qué falta`
- `quien no está matriculado no puede entregar, aunque la convocatoria esté abierta`
- `la entrega con declaración guardada lleva la proporción y la herramienta en el registro`

Estas pruebas cubren los plazos de matrícula, el permiso por asignatura y la presencia de la declaración de uso de IA. No determinan si la declaración es verdadera.

### Notas, aprobaciones y correcciones

- `sin que el profesor firme, la nota no se escribe y el núcleo pregunta`
- `con la firma del profesor la nota se escribe y nombra a quien firmó en el recibo`
- `otro profesor no puede firmar la nota de una asignatura que no imparte`
- `una nota firmada no se edita: la operación no existe`
- `corregir una nota firmada se hace con otra nota que la sustituye, y quedan las dos`
- `la estudiante no puede firmar su propia nota: el núcleo filtra al agente`
- `el gate del núcleo cuenta el nombre que le escriban, aunque no sea el profesor: por eso la firma es otra capa`

La última prueba registra un límite del kernel consumido: su compuerta de firmantes cuenta el nombre suministrado. La capa criptográfica separada de Cátedra rechaza una firma inválida, pero el recibo del kernel puede conservar el nombre ingresado. Un nombre en esa compuerta no demuestra identidad.

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

Estas pruebas revisan el comportamiento del registro local, las reglas de aprobación, la emisión repetida y los límites declarados por el verificador. No establecen que una universidad real haya emitido el título. Su anclaje sigue en `pending`; no hay hash de testnet, identificador de transacción ni entrada en un explorador público.

### Terminal y kernel consumido

- `los cuatro comandos de listado de la terminal funcionan`
- `la terminal acepta las banderas antes o después del comando`
- `la terminal devuelve un código distinto de cero cuando el hecho no ocurrió`
- `el núcleo que consume Cátedra es el corte fijado, módulo por módulo`
- `el encabezado de los cinco módulos declara el mismo commit`
- `Cátedra carga el núcleo desde la copia vendorizada, no desde el árbol de desarrollo`

Las pruebas de terminal cubren el listado, la ubicación de las banderas y el código de salida distinto de cero cuando un acto falla. Las pruebas del kernel comprueban el commit declarado y que Cátedra cargue su copia vendorizada. La primera de esas comprobaciones del kernel es la falla capturada que se explica arriba.

## Hallazgos adversariales

El acuerdo y el registro de fases dicen que ocho pruebas rojas se escribieron antes de implementar y que se observó fallar cada una. El primer fallo honesto fue que faltaba el módulo `../src/catedra.js`. El trabajo adversarial también encontró tres cosas:

1. La compuerta de firmantes del kernel cuenta un nombre ingresado por quien opera, no una clave autenticada. La capa criptográfica de Cátedra rechaza una firma inválida, pero el recibo del kernel aún puede nombrar a la persona indicada.
2. El reloj de los grants es el reloj real del kernel. No se puede inyectar un `now`, así que las fechas de ejemplo de la convocatoria cambian según el día en que corre la suite.
3. Un intento rechazado permanece en el registro como intento sin firma. No se borra, por lo que se conserva evidencia de que ocurrió.

## Recorrido y corrida anterior

Los materiales del proyecto informan un recorrido completo de terminal de 20 pasos que termina en una pantalla sobre los límites. También registran una corrida en sesión fresca con el kernel fijado anterior y RC5 activa en Claude Code, Codex y OpenCode: 35/35 pruebas y 27 comandos de terminal sin fallos. Esa es una corrida histórica contra la fijación anterior. No es el resultado capturado contra el kernel instalado actualmente.

Los materiales dicen que las líneas del recorrido de terminal proceden de una ejecución real. Su transcripción no está incluida en este repositorio público, por eso el diálogo esquemático del README no es una cita de corrida ni una salida inventada.

## Cómo repetir las pruebas cuando se abra el código

El paquete del proyecto define `npm test` para la suite y `node src/recorrido.js` para el recorrido. También define `npm run recorrido`, `npm run cli` y `npm run fuera`. El código fuente no está en este repositorio, así que hoy no se pueden ejecutar desde esta copia pública. Cuando esté disponible, primero revisa el cambio de fijación del kernel y luego ejecuta otra vez la suite. Para obtener un resultado verde contra un kernel nuevo se necesita una fijación explícita y evidencia de una corrida nueva.

No se afirma que haya evidencia de transacciones de testnet. El acuerdo del proyecto dice que no hay blockchain, pagos, anclaje a testnet, identificador de transacción ni entrada en un explorador.
