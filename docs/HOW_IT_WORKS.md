# How Cátedra works

Cátedra is a fictional university intranet run through Vespi. Its vertical path records enrollment, a student's AI-use declaration with submitted work, a professor's signed grade, and a degree issuance. The project uses synthetic data only. It has no institutional integration, network access, blockchain, payments, or testnet anchor.

## Actors, rights and boundaries

| Actor | What they may do | Boundary |
|---|---|---|
| University secretary | Open an enrollment call and perform enrollment and institutional signing operations under a scoped Vespi grant | Cannot consent for a professor or replace a required signature |
| Student | Enroll in a course and submit work with the required AI-use declaration | Cannot sign a grade; the declaration is required but its truth is not checked |
| Professor | Sign grades for the course they teach, through the human approval gate | A local cryptographic key binds a signature to content; it does not prove civil identity |
| Degree office | Provide the second required signature for a degree | A degree is not issued with only one of its two required signatures |
| Independent verifier | Recompute what it can from the record and receipt inputs | Can check integrity, not authorship, identity, truth, or the degree's external existence |
| Reader without Cátedra | Inspect the record and the independent verification output | The central claim that the degree is an externally verifiable credential remains unproven |

The system is the agent that performs an operation. It does not consent for a person. Each operation uses a scoped Vespi authority. An authority grants only the described action and destination; it does not inherit permissions the Vespi agreement did not grant.

## A complete example

Imagine a student enrolling in a fictional course during its open call. The secretary's enrollment operation is permitted only while that call is in force. The enrollment leaves a receipt in the local record.

The student submits an assignment for that course and provides the required declaration of which AI tools were used and in what proportion. Without the complete declaration, the submission is blocked. Cátedra stores what was declared; it does not determine whether the declaration is true. Enrollment in a different course does not grant permission to submit here.

The professor reviews the work and signs the grade through the approval gate. The student's key cannot approve the grade, and a professor cannot sign for a course they do not teach. The signature is ed25519 over the grade content and is checked against the registered public key. In this demonstration, the professor's private key is stored beside the record, so this proves content integrity rather than identity.

A signed grade is not edited in place. To correct it, a new grade is issued as a replacement and both records remain. To issue a degree, the professor and the degree office must both sign. Repeating the same degree issuance returns the original receipt rather than creating a second credential.

An independent process can recompute receipt digests and record-line hashes using Node's built-in crypto facilities without loading Cátedra or Vespi. That can show that the local record was not edited after it was written. The degree anchor remains `pending`: there is no testnet hash, transaction ID, public explorer entry, or external chain for a reader to inspect. The demonstration therefore ends by showing what this verification does not establish.

## Rules the agreement makes visible

- Enrollment is allowed only while the enrollment call is active. Outside its dates the operation is blocked and no enrollment is written.
- A student may submit only to a course in which they are enrolled. A complete AI-use declaration is required for submission, but the system does not validate its truth.
- Only the professor assigned to that course may sign its grade, and the signature must pass through the human approval gate.
- A student's own key cannot sign their grade. A name entered at the core's signer gate is not, by itself, an authenticated signature; Cátedra's cryptographic layer must also verify.
- A signed grade cannot be edited. A correction is a new record that replaces the earlier grade while preserving both.
- A degree requires two approvals: the professor and the degree office. Repeated issuance is idempotent and keeps the first receipt.
- Each operation records what was requested, the authority used, the named approver, the action, the verifier result, and the content digest. Its anchor is still pending.
- The record and keys are local files. The run is reversible by removing the project data; it has no external side effect.

## What this demonstrates

The project reports tests for enrollment windows, course-specific permissions, required declarations, signer boundaries, grade replacement, two-party degree issuance, idempotent receipts, altered records, and verification in a separate process. At the captured state, 34 of 35 tests pass. The remaining failure is the test that checks the pinned kernel digest. The project was built against kernel cut `54c20c7`; the installed kernel is now 0.1.3, so the intentional pin check fails until the project is re-pinned and its suite is rerun.

The separate verifier demonstrates local record integrity for the supplied inputs. The signature demonstrates that the grade content matches the registered public key. Neither establishes who controlled the local private key. No test establishes that a real university adopted the system, that an AI-use declaration is true, or that a degree is verifiable by a reader outside the project.

See [Evidence](EVIDENCE.md) for test names and results, and [Legal and limits](LEGAL_AND_LIMITS.md) for legal claims and open questions.

---

# Cómo funciona Cátedra

Cátedra es la intranet de una universidad ficticia, ejecutada a través de Vespi. Su recorrido vertical registra matrícula, una entrega con declaración de uso de IA, una nota firmada por el profesor y la emisión de un título. El proyecto usa solo datos sintéticos. No tiene integración institucional, acceso a la red, blockchain, pagos ni anclaje a testnet.

## Actores, derechos y límites

| Actor | Qué puede hacer | Límite |
|---|---|---|
| Secretaria de la universidad | Abrir una convocatoria y ejecutar operaciones de matrícula y firma institucional con una autorización acotada de Vespi | No puede consentir por un profesor ni reemplazar una firma requerida |
| Estudiante | Matricularse en una asignatura y entregar trabajo con la declaración de uso de IA requerida | No puede firmar una nota; la declaración es obligatoria, pero no se comprueba su veracidad |
| Profesor | Firmar notas de la asignatura que imparte, por la compuerta de aprobación humana | Una clave criptográfica local liga una firma al contenido; no demuestra identidad civil |
| Oficina de títulos | Dar la segunda firma requerida para un título | El título no se emite con una sola de las dos firmas requeridas |
| Verificador independiente | Recalcular lo que pueda a partir del registro y los datos de los recibos | Puede comprobar integridad, no autoría, identidad, veracidad ni existencia externa del título |
| Lector sin Cátedra | Inspeccionar el registro y el resultado de la verificación independiente | La afirmación central de que el título es una credencial verificable fuera del proyecto sigue sin demostrarse |

El sistema es el agente que ejecuta una operación. No consiente por una persona. Cada operación usa una autoridad acotada de Vespi. La autoridad concede solo la acción y el destino descritos; no hereda permisos que el acuerdo de Vespi no otorgó.

## Un ejemplo completo

Imagina que una estudiante se matricula en una asignatura ficticia durante su convocatoria abierta. La operación de matrícula de la secretaria se permite solo mientras la convocatoria esté vigente. La matrícula deja un recibo en el registro local.

La estudiante entrega un trabajo de esa asignatura e incluye la declaración requerida: qué herramientas de IA usó y en qué proporción. Sin la declaración completa, la entrega queda bloqueada. Cátedra guarda lo declarado, pero no determina si es cierto. La matrícula en otra asignatura no da permiso para entregar aquí.

El profesor revisa el trabajo y firma la nota por la compuerta de aprobación. La clave de la estudiante no puede aprobarla, y un profesor no puede firmar por una asignatura que no imparte. La firma ed25519 cubre el contenido de la nota y se comprueba contra la clave pública registrada. En esta demostración, la clave privada del profesor está junto al registro, así que esto prueba integridad del contenido, no identidad.

Una nota firmada no se edita en el mismo lugar. Para corregirla se emite otra que sustituye a la anterior, y ambas quedan en el registro. Para emitir un título deben firmar tanto el profesor como la oficina de títulos. Repetir la misma emisión devuelve el recibo original en vez de crear una segunda credencial.

Un proceso independiente puede recalcular los digests de los recibos y las huellas de las líneas del registro con las herramientas criptográficas incluidas en Node, sin cargar Cátedra ni Vespi. Esto puede mostrar que el registro local no se editó después de escribirse. El anclaje del título sigue en `pending`: no hay hash de testnet, identificador de transacción, entrada en un explorador público ni cadena externa que un lector pueda revisar. Por eso la demostración termina indicando qué no establece esta verificación.

## Reglas que el acuerdo hace visibles

- La matrícula se permite solo mientras la convocatoria está activa. Fuera de sus fechas la operación se bloquea y no escribe la matrícula.
- La estudiante solo puede entregar en una asignatura en la que está matriculada. La entrega requiere una declaración completa de uso de IA, pero el sistema no valida su veracidad.
- Solo el profesor asignado a esa asignatura puede firmar su nota, y la firma debe pasar por la compuerta de aprobación humana.
- La clave de la estudiante no puede firmar su nota. Un nombre escrito en la compuerta de firmantes del núcleo no es, por sí solo, una firma autenticada; también debe verificar la capa criptográfica de Cátedra.
- Una nota firmada no se edita. La corrección es un registro nuevo que sustituye al anterior y conserva ambos.
- Un título requiere dos aprobaciones: las del profesor y de la oficina de títulos. Repetir la emisión es idempotente y conserva el primer recibo.
- Cada operación registra lo solicitado, la autoridad usada, el aprobador nombrado, la acción, el resultado del verificador y el digest del contenido. Su anclaje sigue pendiente.
- El registro y las claves son archivos locales. La corrida es reversible al eliminar los datos del proyecto y no tiene efectos externos.

## Qué demuestra

El proyecto reporta pruebas de ventanas de matrícula, permisos por asignatura, declaraciones obligatorias, límites de firmantes, sustitución de notas, emisión del título con dos partes, recibos idempotentes, alteración de registros y verificación en un proceso aparte. En el estado capturado, pasan 34 de 35 pruebas. La restante comprueba el digest fijado del núcleo. El proyecto se construyó contra el corte `54c20c7`; el núcleo instalado ahora es 0.1.3, así que la comprobación intencional de la fijación falla hasta que se vuelva a fijar el proyecto y se corra la suite de nuevo.

El verificador aparte demuestra integridad local del registro con las entradas suministradas. La firma demuestra que el contenido de la nota coincide con la clave pública registrada. Ninguna de las dos cosas establece quién controlaba la clave privada local. Ninguna prueba establece que una universidad real adoptó el sistema, que una declaración de uso de IA sea verdadera o que un lector ajeno al proyecto pueda verificar el título.

Consulta [Evidencia](EVIDENCE.md) para los nombres y resultados de las pruebas, y [Marco legal y límites](LEGAL_AND_LIMITS.md) para las afirmaciones jurídicas y preguntas abiertas.
