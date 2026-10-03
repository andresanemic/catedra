# How Cátedra works

Cátedra is a fictional university intranet with one vertical path: enrollment, a submitted assignment with an AI-use declaration, a professor-signed grade, degree issuance, and a separate check of local receipts. The path is scoped to synthetic data and local files. There is no institutional integration, network access, blockchain, payment flow, or testnet anchor.

## The path at a glance

```text
Secretary opens an enrollment call
  └─ Student enrolls while the call is open → local receipt
       └─ Student submits to that course with a complete AI-use declaration
            └─ Assigned professor approves and signs a grade
                 ├─ Correction creates a new grade; both records remain
                 └─ Professor + degree office approve degree issuance
                      └─ Separate process recomputes local integrity
                           └─ Degree anchor remains pending
```

The agreement treats each step as its own act. Permission for enrollment does not authorize a submission, and permission to submit is tied to the enrolled course. A later degree approval does not make the earlier acts interchangeable.

## Actors, rights, and limits

| Actor | What the flow permits | Boundary |
|---|---|---|
| University secretary | Open an enrollment call and perform enrollment or institutional signing operations under a scoped grant | Cannot consent for a professor or replace a required signature |
| Student | Enroll in a course and submit work with the required AI-use declaration | Cannot sign a grade; declaration truth is not checked |
| Professor | Sign grades for the course they teach through the human approval gate | The local private key is stored beside the record in this demonstration |
| Degree office | Provide the second required signature for a degree | One approval alone cannot issue the degree |
| Cátedra process | Execute an operation as the agent under the grant for that operation | The system does not consent for a person |
| Independent verifier | Recompute receipt digests and record-line hashes from supplied inputs | Establishes local integrity, not identity, truth, authorship, or external issuance |
| Reader without Cátedra | Inspect the record and separate verifier result | There is no public anchor for checking that an outside university issued the degree |

## Authority follows the act

**Enrollment.** The secretary opens a call with an opening and closing window. Enrollment is allowed only while it is in force. Before or after that window the operation is blocked and no enrollment is written. The grant carries the call's closing time.

**Submission.** Enrollment in a course is the permission to submit to that course. The grant is scoped to the course destination, so enrollment elsewhere does not authorize this submission. A complete AI-use declaration is required as data attached to the submission. It is not an authority rule and its truth is not evaluated.

**Grade.** Only the professor assigned to the course may approve its grade. The approval passes through the human gate. A student cannot sign their own grade, and a professor assigned to another course cannot sign it. The cryptographic signature is ed25519 over grade content and is checked against the registered public key. In this demonstration the private key is kept beside the record, so the signature shows a content-to-key relationship, not the civil identity of the key holder.

**Correction.** A signed grade is not edited in place because the operation is not provided. A correction creates a replacement grade and preserves both records. The test suite also records a rejected unsigned attempt as an attempt, not as a grade.

**Degree.** Issuance requires two approvals, one from the professor and one from the degree office. Repeating the same issuance returns the original receipt rather than creating another credential. This local idempotency does not make the degree externally verifiable.

## Receipts and independent checking

Each operation records the request, authority, named approver, action, verifier result, and content digest. The receipt uses the canonical digest also used by the consumed kernel. Editing a receipt by hand causes its verification to fail.

The separate verifier recalculates receipt digests and record-line hashes using Node's built-in crypto facilities. Its test runs in a process that does not load Cátedra or Vespi. That boundary lets a reader check whether the supplied local record still matches its integrity values without trusting the reporting process that created it.

The check does not prove who wrote the record, who controlled a private key, whether a declaration is true, or whether a university issued a degree outside the demonstration. The degree anchor is `pending`; the project has no testnet hash, transaction ID, or public explorer entry.

## Relationship to Vespi and Lore Plugin

Cátedra consumes the Vespi kernel without modifying it. The project uses its scoped authority grants, operation and receipt model, canonical receipt digest, and human signer gate. The kernel pin is explicit and checked module by module. The test that checks the current digest is the one failing because the installed kernel has moved beyond the cut Cátedra pinned.

The adversarial test found that the kernel signer gate counts the name entered at the gate rather than authenticating a key. Cátedra's separate cryptographic signature check rejects an invalid signature, but the kernel receipt can still retain the supplied name. This distinction is part of the project's evidence, not a claim that the kernel authenticates identities.

Lore Plugin provides project criteria and the project context used to guide the work. It is not the runtime that records academic acts. The agreement and project criteria define what the path should make visible; the Vespi kernel supplies the scoped operation and receipt mechanism that the project consumes.

## Walkthrough and limits

The project materials report a 20-step terminal walkthrough from enrollment to a limits screen. They also specify `node src/recorrido.js` as its entry point once the source is available. This public repository does not include that source or a transcript, so the dialogue in the README is schematic and should not be read as literal terminal output.

The agreement describes the effect as local and reversible: an operation writes a line in a project record that can be removed with the project data. It does not send the act to a third-party service. These properties belong to the described demonstration and do not amount to a deployment review for a real institution.

See [Evidence](EVIDENCE.md) for the captured test record and [Legal and limits](LEGAL_AND_LIMITS.md) for claims the demonstration does not establish.

---

# Cómo funciona Cátedra

Cátedra es la intranet de una universidad ficticia con un recorrido vertical: matrícula, entrega de un trabajo con declaración de uso de IA, nota firmada por el profesor, emisión del título y comprobación separada de los recibos locales. El recorrido usa datos sintéticos y archivos locales. No hay integración institucional, acceso a la red, blockchain, pagos ni anclaje a testnet.

## El recorrido de un vistazo

```text
La secretaria abre una convocatoria de matrícula
  └─ La estudiante se matricula mientras está abierta → recibo local
       └─ Entrega en esa asignatura con declaración completa de uso de IA
            └─ El profesor asignado aprueba y firma una nota
                 ├─ Corregirla crea una nota nueva; quedan ambos registros
                 └─ Profesor + oficina de títulos aprueban la emisión
                      └─ Otro proceso recalcula la integridad local
                           └─ El anclaje del título sigue pendiente
```

El acuerdo trata cada paso como un acto propio. El permiso para matricularse no autoriza una entrega, y el permiso para entregar se vincula con la asignatura en que la persona está matriculada. Una aprobación posterior del título no vuelve intercambiables los actos anteriores.

## Actores, derechos y límites

| Actor | Qué permite el recorrido | Frontera |
|---|---|---|
| Secretaria de la universidad | Abrir una convocatoria y ejecutar matrícula u operaciones institucionales de firma con un grant acotado | No puede consentir por un profesor ni reemplazar una firma requerida |
| Estudiante | Matricularse en una asignatura y entregar un trabajo con la declaración de uso de IA requerida | No puede firmar una nota; no se comprueba la verdad de la declaración |
| Profesor | Firmar notas de la asignatura que imparte por la compuerta de aprobación humana | En esta demostración la clave privada local está junto al registro |
| Oficina de títulos | Proporcionar la segunda firma requerida para un título | Una aprobación por sí sola no basta para emitirlo |
| Proceso de Cátedra | Ejecutar una operación como agente con la autorización correspondiente | El sistema no consiente por una persona |
| Verificador independiente | Recalcular digests de recibos y huellas de las líneas del registro a partir de los datos suministrados | Comprueba integridad local, no identidad, veracidad, autoría ni emisión externa |
| Lector sin Cátedra | Inspeccionar el registro y el resultado del verificador separado | No hay un anclaje público para comprobar que una universidad externa emitió el título |

## La autoridad depende del acto

**Matrícula.** La secretaria abre una convocatoria con fecha de inicio y cierre. Solo se permite matricularse mientras está vigente. Antes o después de ese plazo, la operación queda bloqueada y no escribe la matrícula. El grant lleva la hora de cierre de la convocatoria.

**Entrega.** La matrícula en una asignatura es el permiso para entregar en esa asignatura. El grant se acota al destino de la asignatura, así que estar matriculado en otra no autoriza esta entrega. Se requiere una declaración completa de uso de IA como dato adjunto. No es una regla de autoridad y no se evalúa su veracidad.

**Nota.** Solo el profesor asignado a la asignatura puede aprobar su nota. La aprobación pasa por la compuerta humana. Una estudiante no puede firmar su propia nota y un profesor de otra asignatura tampoco puede firmarla. La firma criptográfica ed25519 cubre el contenido de la nota y se comprueba contra la clave pública registrada. En esta demostración la clave privada se conserva junto al registro, por lo que la firma muestra un vínculo entre contenido y clave, no la identidad civil de quien la controla.

**Corrección.** Una nota firmada no se edita en el mismo lugar porque la operación no existe. La corrección crea una nota sustituta y conserva ambos registros. La suite también registra un intento rechazado sin firma como intento, no como nota.

**Título.** La emisión requiere dos aprobaciones, una del profesor y otra de la oficina de títulos. Si se repite la misma emisión, se devuelve el recibo original en vez de crear otra credencial. Esta idempotencia local no vuelve verificable el título desde afuera.

## Recibos y comprobación independiente

Cada operación registra la solicitud, la autoridad, el aprobador nombrado, la acción, el resultado del verificador y el digest del contenido. El recibo usa el digest canónico que también usa el kernel consumido. Si alguien modifica un recibo a mano, su verificación falla.

El verificador separado recalcula digests de recibos y huellas de las líneas del registro mediante las funciones criptográficas integradas de Node. Su prueba corre en un proceso que no carga Cátedra ni Vespi. Esa frontera permite revisar si el registro local suministrado conserva sus valores de integridad sin confiar en el proceso que informa cómo se creó.

La comprobación no demuestra quién escribió el registro, quién controlaba una clave privada, si una declaración es cierta ni si una universidad emitió el título fuera de la demostración. El anclaje del título está en `pending`; el proyecto no tiene hash de testnet, identificador de transacción ni entrada en un explorador público.

## Relación con Vespi y Lore Plugin

Cátedra consume el kernel de Vespi sin modificarlo. El proyecto usa sus grants de autoridad acotada, su modelo de operaciones y recibos, el digest canónico del recibo y la compuerta de firmantes humanos. La fijación del kernel es explícita y se comprueba módulo por módulo. La prueba del digest actual es la que falla porque el kernel instalado avanzó más allá del corte fijado por Cátedra.

La prueba adversarial encontró que la compuerta de firmantes del kernel cuenta el nombre ingresado en vez de autenticar una clave. La comprobación criptográfica separada de Cátedra rechaza una firma inválida, pero el recibo del kernel puede conservar el nombre suministrado. Esta distinción forma parte de la evidencia del proyecto y no afirma que el kernel autentique identidades.

Lore Plugin aporta criterios y el contexto de proyecto que orientan el trabajo. No es el entorno de ejecución que registra actos académicos. El acuerdo y los criterios del proyecto definen qué debe hacer visible el recorrido; el kernel de Vespi proporciona el mecanismo de operaciones acotadas y recibos que consume el proyecto.

## Recorrido y límites

Los materiales del proyecto informan un recorrido de terminal de 20 pasos, desde la matrícula hasta una pantalla de límites. También indican `node src/recorrido.js` como punto de entrada cuando el código esté disponible. Este repositorio público no incluye ese código ni una transcripción, por eso el diálogo del README es esquemático y no debe leerse como salida literal de la terminal.

El acuerdo describe el efecto como local y reversible: cada operación escribe una línea en un registro del proyecto que puede eliminarse junto con los datos del proyecto. No envía el acto a un servicio de terceros. Estas propiedades corresponden a la demostración descrita y no constituyen una revisión de despliegue para una institución real.

Consulta [Evidencia](EVIDENCE.md) para ver el registro de pruebas capturado y [Marco legal y límites](LEGAL_AND_LIMITS.md) para revisar lo que la demostración no establece.
