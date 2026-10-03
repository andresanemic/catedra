[![Cátedra: a university record built around declared AI use, signed grades and degrees](./assets/cover.png)](./assets/cover.png)

# Cátedra

<p align="center">
  <a href="#english"><img src="https://img.shields.io/badge/status-working_path-D7B698?style=for-the-badge&labelColor=07111A" alt="Status: working path"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-review--only-D7B698?style=for-the-badge&labelColor=07111A" alt="License: review only"></a>
  <a href="./docs/EVIDENCE.md"><img src="https://img.shields.io/badge/suite-34_of_35-D7B698?style=for-the-badge&labelColor=07111A" alt="Suite: 34 of 35 pass"></a>
  <a href="./docs/HOW_IT_WORKS.md"><img src="https://img.shields.io/badge/agreement-before_code-E0C170?style=for-the-badge&labelColor=07111A" alt="Agreement before code"></a>
  <a href="https://github.com/andresanemic/vespi"><img src="https://img.shields.io/badge/built_with-Vespi_%C2%B7_Lore_Plugin-E0C170?style=for-the-badge&labelColor=07111A" alt="Built with Vespi and Lore Plugin"></a>
</p>

<p align="center">
  <b>Cátedra records declared AI use, professor-signed grades and degrees as institutional acts with receipts.</b>
</p>

<p align="center">
  <b>Do you build on Stellar, or are you judging Find Your Way or Meridian? Start here.</b><br>
  Cátedra is one of ten functional projects built on <a href="https://github.com/andresanemic/vespi">Vespi</a> with <a href="https://github.com/andresanemic/lore-plugin">Lore Plugin</a>, explored through a fictional university and synthetic data.
</p>

<p align="center">
  This repository contains documentation and evidence drawn from the project agreement. The source code is not included yet; it will open during the judges' review period under a license for reading and cloning to evaluate.
</p>

---

<details>
<summary><b>Read in English</b></summary>

<a id="english"></a>

**Cátedra makes the acts behind an academic record inspectable, from enrollment through a signed grade and a degree.**

> **The unit is the institutional act and its receipt: who had authority, what happened, and what can be checked afterward.**

Cátedra is a fictional university intranet built on Vespi. A student enrolls, submits work with a declaration of AI use, receives a grade signed by the course professor, and may have a degree issued with two required signatures. Each operation leaves a receipt in a local record. All data are fictional and synthetic; no real personal, health, financial or third-party data are used.

## Why

In a university, enrollment, submitted work, AI-use declarations, grades and degrees can live in separate records. If the institution cannot show who was allowed to perform each act and what was recorded, an outside reader has to trust the system that produced the record. Cátedra explores how authority and receipts can make those steps legible. Its current degree is not externally verifiable: its anchor is pending and there is no public chain entry to inspect.

## If you are judging Find Your Way or Meridian, start here

1. **Read the project basis.** [`How it works`](./docs/HOW_IT_WORKS.md) summarizes the agreement's problem, actors, authority and limits.
2. **Follow the path.** [`How it works`](./docs/HOW_IT_WORKS.md) describes enrollment, an AI-declared submission, a signed grade, a degree and independent checking.
3. **Open the evidence.** [`Evidence`](./docs/EVIDENCE.md) lists the real test names and the captured 34-of-35 result.
4. **Read the boundaries.** The kernel pin has moved, the title's external verification is unproven, and the legal limits are in [`Legal and limits`](./docs/LEGAL_AND_LIMITS.md).
5. **Review the release.** The code is not in this repository yet. It will open during the judges' review period under the [review-only license](./LICENSE).

## In one minute

A student enrolls in a fictional course while its call is open. She submits an assignment with the required declaration of which AI she used and in what proportion. The professor signs the grade through the human approval gate. If the grade needs correction, a new grade replaces it and both remain in the record. Later, the professor and the degree office each approve the degree. A separate process can recompute the local receipt and record hashes without loading Cátedra. It cannot prove who held the professor's key, and the degree itself has no external anchor to verify. The example uses only fictional data.

## Why Cátedra

| You need | What it gives you | Where it lives |
|---|---|---|
| Enrollment linked to an active call | A scoped enrollment act that is blocked outside the call window | [How it works](./docs/HOW_IT_WORKS.md) |
| A record of declared AI use with submitted work | A required declaration stored with the submission; its truth is not checked | [How it works](./docs/HOW_IT_WORKS.md) |
| A grade tied to an authorized professor | A human approval gate and a cryptographic signature over grade content | [How it works](./docs/HOW_IT_WORKS.md) |
| Corrections that preserve history | A replacement grade is a new record; the signed grade is not edited in place | [How it works](./docs/HOW_IT_WORKS.md) |
| A check of the local record | An independent process recomputes receipt digests and line hashes | [Evidence](./docs/EVIDENCE.md) |
| A clear account of what is still unproven | Current suite result, kernel pin, legal boundaries and missing external anchor | [Evidence](./docs/EVIDENCE.md) · [Legal and limits](./docs/LEGAL_AND_LIMITS.md) |

**What Cátedra is not.** It is not a learning management system, a full academic registry or a real university service. It does not verify that an AI-use declaration is true, establish a signer's civil identity, or make the degree externally verifiable. It does not modify Vespi or connect to a blockchain, payment rail or institution.

## How it works

```
  University secretary ── opens call / enrolls
                                  │ scoped authority
                                  ▼
  Student ── submits work + required AI-use declaration
                                  │
                                  ▼
  Professor ── human approval gate ── signs grade
                                  │
                                  ├── correction = new grade; both records remain
                                  ▼
  Professor + Degree office ── two approvals ── degree record
                                  │
                                  ▼
  Local receipts and record ── separate process recomputes integrity
                                  │
                                  └── degree anchor pending; no external verification
```

| Actor | Rights in the flow | Limit |
|---|---|---|
| University secretary | Opens the call and performs enrollment or institutional acts under scoped authority | Cannot consent for a professor |
| Student | Enrolls and submits work with an AI-use declaration | Cannot sign their own grade; declaration truth is not checked |
| Professor | Signs grades for their course and co-approves degrees | Local key proves a content-to-key link, not identity |
| Degree office | Provides the second degree signature | A single signature does not issue the degree |
| Independent verifier | Recomputes local receipt and record integrity | Does not prove identity, truth or external issuance |

The details and boundaries are in [`How it works`](./docs/HOW_IT_WORKS.md).

## Evidence you can open

The captured suite has 35 tests: 34 pass and one fails. The failure is the module-by-module kernel digest check. Cátedra was built against kernel cut `54c20c7`; the installed kernel is now 0.1.3. The nine code projects were built against the 2026-09-29 cut and report green suites there. Each pins the kernel digest it consumes, so the check fails intentionally when the kernel moves. Re-pinning and rerunning remain pending. This is a working path, not a finished product or a claim of readiness for use.

The tests cover enrollment windows, course permission, required declarations, human approval, grade replacement, two-party degree issuance, receipt integrity, terminal behavior and an independent verifier. The adversarial phase found that the kernel gate counts supplied signer names rather than authenticating keys; the separate Cátedra signature layer rejects an invalid signature, while the kernel receipt can still name the supplied person. It also found that grant timing uses the kernel's real clock and that rejected attempts remain recorded as unsigned attempts.

There are no Cátedra testnet transactions to inspect. The agreement says the project has no blockchain, payments, testnet anchor, transaction ID or explorer record. See [`Evidence`](./docs/EVIDENCE.md) for test names and rerun instructions after the code opens.

## Cátedra, Vespi and Lore Plugin

[Vespi](https://github.com/andresanemic/vespi) is the kernel Cátedra consumes without modifying. Operations run under scoped authority, and operations that require a person's approval use the human signer gate. Receipts record the requested act, its authority, the named approver, the action, verifier result and content digest. A separate verifier recomputes local record integrity rather than trusting the operation's own report. Those receipts preserve what happened in this local record; they do not make the degree externally verifiable while its anchor remains pending. [Lore Plugin](https://github.com/andresanemic/lore-plugin) provides the project criteria and routes work through the relevant project context.

## What it does not do, and what is not verified

Cátedra does not prove that a declared AI-use account is true, that a key belongs to a named professor, or that a real university issued a degree. Its degree anchor is pending; no hash, transaction ID or external chain is available. It does not claim compliance with any law. The agreement mentions Chile's Law 21.719 as a design concern, but says the primary text was not reviewed and the implementation was not checked against it. No competent legal review has taken place. All data used are fictional and synthetic. The current kernel pin also needs to be updated and the suite rerun. See [`Legal and limits`](./docs/LEGAL_AND_LIMITS.md).

## How to review this project

Today this repository contains documentation of the agreement, evidence and the review-only [LICENSE](./LICENSE), not the source code. [`CODE_NOT_INCLUDED.md`](./CODE_NOT_INCLUDED.md) explains the release timing. The code will open during the judges' review period so the Find Your Way and Meridian judges and the community can read and clone it to evaluate it, not modify it.

## Author

**Andrés Peña**, repository authority: `andresanemic`.

[<img src="./assets/icons/v2/telegram.svg" width="28" alt="Telegram">](https://t.me/andresanemic) &nbsp;&nbsp; [<picture><source media="(prefers-color-scheme: dark)" srcset="./assets/icons/v2/x-dark.svg"><img src="./assets/icons/v2/x.svg" width="28" alt="X"></picture>](https://x.com/andresanemic) &nbsp;&nbsp; [<img src="./assets/icons/v2/linkedin.svg" width="28" alt="LinkedIn">](https://www.linkedin.com/in/andresanemic/)

---

[How it works](./docs/HOW_IT_WORKS.md) · [Evidence](./docs/EVIDENCE.md) · [Legal and limits](./docs/LEGAL_AND_LIMITS.md) · [Code not included](./CODE_NOT_INCLUDED.md) · [Review-only license](./LICENSE) · [Vespi](https://github.com/andresanemic/vespi) · [Lore Plugin](https://github.com/andresanemic/lore-plugin)

</details>

<details>
<summary><b>Leer en español</b></summary>

<a id="espanol"></a>

**Cátedra permite inspeccionar los actos de un registro académico, desde la matrícula hasta una nota firmada y un título.**

> **La unidad es el acto institucional y su recibo: quién tenía autoridad, qué ocurrió y qué puede comprobarse después.**

Cátedra es la intranet de una universidad ficticia construida sobre Vespi. Una estudiante se matricula, entrega un trabajo con una declaración de uso de IA, recibe una nota firmada por el profesor de la asignatura y puede obtener un título con dos firmas requeridas. Cada operación deja un recibo en un registro local. Todos los datos son de fantasía y sintéticos; no se usan datos reales personales, de salud, financieros ni de terceros.

## Por qué

En una universidad, la matrícula, los trabajos, las declaraciones de uso de IA, las notas y los títulos pueden vivir en registros separados. Si la institución no puede mostrar quién tenía permiso para realizar cada acto y qué quedó registrado, alguien externo debe confiar en el sistema que produjo el registro. Cátedra explora cómo la autoridad y los recibos pueden hacer legibles esos pasos. Hoy el título no es verificable desde afuera: su anclaje está pendiente y no existe una entrada pública en una cadena que se pueda inspeccionar.

## Si estás evaluando Find Your Way o Meridian, empieza aquí

1. **Lee la base del proyecto.** [`Cómo funciona`](./docs/HOW_IT_WORKS.md) resume el problema, los actores, la autoridad y los límites del acuerdo.
2. **Sigue el recorrido.** [`Cómo funciona`](./docs/HOW_IT_WORKS.md) describe la matrícula, la entrega con declaración de IA, la nota firmada, el título y la comprobación independiente.
3. **Abre la evidencia.** [`Evidencia`](./docs/EVIDENCE.md) enumera los nombres reales de las pruebas y el resultado capturado de 34/35.
4. **Lee los límites.** La fijación del kernel se movió, la verificación externa del título no está demostrada y los límites jurídicos están en [`Marco legal y límites`](./docs/LEGAL_AND_LIMITS.md).
5. **Revisa la publicación.** El código aún no está en este repositorio. Se abrirá durante el periodo de los jueces bajo la [licencia de solo revisión](./LICENSE).

## En un minuto

Una estudiante se matricula en una asignatura ficticia mientras su convocatoria está abierta. Entrega un trabajo con la declaración requerida sobre qué IA usó y en qué proporción. El profesor firma la nota por la compuerta de aprobación humana. Si hay que corregirla, una nota nueva sustituye a la anterior y ambas quedan en el registro. Después, el profesor y la oficina de títulos aprueban el título. Un proceso aparte puede recalcular los hashes locales de recibos y registros sin cargar Cátedra. No puede demostrar quién tenía la clave del profesor, y el título no tiene anclaje externo que se pueda verificar. El ejemplo usa solo datos de fantasía.

## Por qué Cátedra

| Necesitas | Qué te da | Dónde vive |
|---|---|---|
| Una matrícula vinculada a una convocatoria vigente | Un acto de matrícula con autoridad acotada que se bloquea fuera del plazo | [Cómo funciona](./docs/HOW_IT_WORKS.md) |
| Un registro de uso de IA declarado junto con el trabajo | Una declaración requerida que queda guardada con la entrega; no se comprueba su veracidad | [Cómo funciona](./docs/HOW_IT_WORKS.md) |
| Una nota vinculada a un profesor autorizado | Una compuerta de aprobación humana y una firma criptográfica sobre el contenido de la nota | [Cómo funciona](./docs/HOW_IT_WORKS.md) |
| Correcciones que conserven el historial | La nota sustituta queda como registro nuevo; la nota firmada no se edita en el mismo lugar | [Cómo funciona](./docs/HOW_IT_WORKS.md) |
| Comprobar el registro local | Un proceso independiente recalcula digests de recibos y huellas de líneas | [Evidencia](./docs/EVIDENCE.md) |
| Saber qué sigue sin demostrarse | Resultado actual de la suite, fijación del kernel, límites jurídicos y falta de anclaje externo | [Evidencia](./docs/EVIDENCE.md) · [Marco legal y límites](./docs/LEGAL_AND_LIMITS.md) |

**Lo que Cátedra no es.** No es un sistema de gestión del aprendizaje, un registro académico completo ni un servicio para una universidad real. No verifica si una declaración de uso de IA es verdadera, no acredita la identidad civil de quien firma ni vuelve verificable el título desde afuera. No modifica Vespi ni se conecta a una blockchain, una vía de pagos o una institución.

## Cómo funciona

```
  Secretaria de universidad ── abre convocatoria / matricula
                                         │ autoridad acotada
                                         ▼
  Estudiante ── entrega trabajo + declaración de uso de IA
                                         │
                                         ▼
  Profesor ── compuerta de aprobación humana ── firma nota
                                         │
                                         ├── corrección = nota nueva; quedan ambas
                                         ▼
  Profesor + Oficina de títulos ── dos aprobaciones ── título
                                         │
                                         ▼
  Recibos y registro local ── otro proceso recalcula integridad
                                         │
                                         └── anclaje pendiente; sin verificación externa
```

| Actor | Derechos en el recorrido | Límite |
|---|---|---|
| Secretaria de la universidad | Abre la convocatoria y ejecuta actos de matrícula o institucionales con autoridad acotada | No puede consentir por un profesor |
| Estudiante | Se matricula y entrega trabajo con declaración de uso de IA | No puede firmar su nota; no se comprueba la verdad de la declaración |
| Profesor | Firma notas de su asignatura y coaprueba títulos | La clave local prueba el vínculo entre contenido y clave, no identidad |
| Oficina de títulos | Proporciona la segunda firma del título | Una sola firma no lo emite |
| Verificador independiente | Recalcula la integridad de recibos y registros locales | No prueba identidad, veracidad ni emisión externa |

Los detalles y límites están en [`Cómo funciona`](./docs/HOW_IT_WORKS.md).

## Evidencia que puedes abrir

La suite capturada tiene 35 pruebas: pasan 34 y falla una. La falla está en la comprobación del digest del kernel módulo por módulo. Cátedra se construyó contra el corte `54c20c7`; el kernel instalado ahora es 0.1.3. Los nueve proyectos con código se construyeron contra el corte del 2026-09-29 y sus registros informan suites verdes allí. Cada uno fija el digest del kernel que consume, así que la comprobación falla intencionalmente cuando el kernel se mueve. Volver a fijarlo y correr de nuevo está pendiente. Esto muestra un recorrido que funciona, no un producto terminado ni una afirmación de que esté listo para usarse.

Las pruebas cubren ventanas de matrícula, permisos por asignatura, declaraciones requeridas, aprobación humana, sustitución de notas, emisión del título por dos partes, integridad de recibos, terminal y verificador independiente. La fase adversarial encontró que la compuerta del kernel cuenta nombres de firmantes ingresados en vez de autenticar claves; la capa de firma separada de Cátedra rechaza una firma inválida, mientras que el recibo del kernel puede conservar el nombre ingresado. También halló que el reloj de las autorizaciones usa la hora real del kernel y que los intentos rechazados quedan registrados como intentos sin firma.

No hay transacciones de testnet de Cátedra para inspeccionar. El acuerdo dice que el proyecto no tiene blockchain, pagos, anclaje a testnet, identificador de transacción ni registro en un explorador. Consulta [`Evidencia`](./docs/EVIDENCE.md) para los nombres de pruebas y las instrucciones para correrlas cuando se abra el código.

## Cátedra, Vespi y Lore Plugin

[Vespi](https://github.com/andresanemic/vespi) es el kernel que Cátedra consume sin modificar. Las operaciones se ejecutan bajo una autoridad acotada, y las que requieren aprobación personal usan la compuerta humana de firmantes. Los recibos registran el acto solicitado, su autoridad, el aprobador nombrado, la acción, el resultado del verificador y el digest del contenido. Un verificador aparte recalcula la integridad del registro local en vez de confiar en el informe de la operación que lo escribió. Esos recibos conservan lo ocurrido en este registro local; no vuelven verificable el título desde afuera mientras el anclaje siga pendiente. [Lore Plugin](https://github.com/andresanemic/lore-plugin) aporta los criterios del proyecto y enruta el trabajo al contexto correspondiente.

## Lo que no hace y lo que no está verificado

Cátedra no prueba que una declaración de uso de IA sea cierta, que una clave pertenezca al profesor nombrado ni que una universidad real haya emitido un título. El anclaje del título está pendiente; no hay hash, identificador de transacción ni cadena externa disponible. No afirma cumplir ninguna ley. El acuerdo menciona la Ley 21.719 de Chile como preocupación de diseño, pero dice que no se revisó el texto primario ni se contrastó la implementación con él. No se ha hecho una revisión jurídica competente. Todos los datos usados son de fantasía y sintéticos. También falta actualizar la fijación del kernel actual y volver a correr la suite. Consulta [`Marco legal y límites`](./docs/LEGAL_AND_LIMITS.md).

## Cómo revisar este proyecto

Hoy este repositorio contiene documentación del acuerdo, evidencia y la [LICENSE](./LICENSE) de solo revisión, no el código fuente. [`CODE_NOT_INCLUDED.md`](./CODE_NOT_INCLUDED.md) explica el momento de la publicación. El código se abrirá durante el periodo de los jueces para que los jueces de Find Your Way y Meridian y la comunidad puedan leerlo y clonarlo para evaluarlo, no modificarlo.

## Autor

**Andrés Peña**, autoridad del repositorio: `andresanemic`.

[<img src="./assets/icons/v2/telegram.svg" width="28" alt="Telegram">](https://t.me/andresanemic) &nbsp;&nbsp; [<picture><source media="(prefers-color-scheme: dark)" srcset="./assets/icons/v2/x-dark.svg"><img src="./assets/icons/v2/x.svg" width="28" alt="X"></picture>](https://x.com/andresanemic) &nbsp;&nbsp; [<img src="./assets/icons/v2/linkedin.svg" width="28" alt="LinkedIn">](https://www.linkedin.com/in/andresanemic/)

---

[Cómo funciona](./docs/HOW_IT_WORKS.md) · [Evidencia](./docs/EVIDENCE.md) · [Marco legal y límites](./docs/LEGAL_AND_LIMITS.md) · [Código no incluido](./CODE_NOT_INCLUDED.md) · [Licencia de solo revisión](./LICENSE) · [Vespi](https://github.com/andresanemic/vespi) · [Lore Plugin](https://github.com/andresanemic/lore-plugin)

</details>
