# Legal framework and limits

This page records the legal and verification boundaries stated in the project agreement. It is not a legal opinion or a claim that the described design is suitable for a real university.

## What the agreement says about law

The agreement mentions Chile's Law 21.719 only as a problem the project illustrates. It says the primary text was not read during this phase and the implementation was not checked against that law. Cátedra therefore makes no claim of compliance with Law 21.719 or any other law or standard.

The agreement also says that the legal anchor that might apply to this project was not checked against an official source. It names no other legal authority. This repository is not a legal review by a competent professional, and no competent legal professional is reported to have reviewed the project's treatment of law.

## Three levels of verification

**Local record integrity: demonstrated with a boundary.** A separate process recalculates each receipt digest and each record-line hash from the supplied inputs using Node's built-in crypto facilities. Its test runs without loading Cátedra or Vespi. A matching result shows that the supplied local record still matches those integrity values. It does not show who wrote the record or whether the recorded statements are true.

**Grade signature: demonstrated with a key-custody reservation.** The grade is signed with ed25519 over its content and checked against a registered public key. In this demonstration, the professor's private key is stored beside the record. The signature therefore links content to a key, but it does not establish the civil identity of the person who controlled that key. In a real setting, custody of the private key and publication of the public key would need a separate arrangement; this project does not validate one.

**Degree issuance outside the project: not verified.** The degree anchor remains `pending`. There is no testnet hash, transaction ID, or public explorer entry. A person without this program and this local record has no public location to consult. The agreement treats an item verifiable only through this program as insufficient for its central credential claim, so this project does not present that claim as proven.

## Claims the project does not make

- It does not claim compliance with Law 21.719, another law, or a standard.
- It does not prove that an AI-use declaration is accurate or complete in substance. The declaration is required as a field, and its truth is not checked.
- It does not establish that a key belongs to the professor named at the signer gate. The kernel gate counts the entered name; the separate Cátedra signature layer can reject an invalid cryptographic signature, but the kernel receipt can still preserve that name.
- It does not establish that a real institution adopted the system, granted permission, or is affiliated with the fictional university. No affiliation with UAI, the UAI Blockchain Laboratory, TECHO, or another third party is claimed.
- It does not show that the degree exists outside the local demonstration or can be independently verified by an outside reader.
- It does not establish readiness for real institutional use or describe a finished product.

All people, courses, and institutional details in the demonstration are fictional. The project materials state that it uses synthetic data and contains no real personal, health, financial, or third-party data.

## Questions for any future real use

The project leaves these as questions, not conclusions about applicable law or institutional practice:

- Which legal, privacy, and institutional requirements would apply to a real deployment?
- What identity checks, key custody, and human approval arrangements would be needed?
- What external mechanism could support independent verification, and precisely what would it prove?
- How should retention, access, correction, and deletion work for a real academic record?

Answering these would require appropriate legal and institutional review, plus evidence about any external verification mechanism. None is supplied by this demonstration.

---

# Marco legal y límites

Esta página registra las fronteras jurídicas y de verificación descritas en el acuerdo del proyecto. No es una opinión jurídica ni afirma que el diseño sea adecuado para una universidad real.

## Lo que dice el acuerdo sobre la ley

El acuerdo menciona la Ley 21.719 de Chile únicamente como un problema que el proyecto ilustra. Indica que durante esta fase no se leyó el texto primario ni se contrastó la implementación con esa ley. Por eso Cátedra no afirma cumplir la Ley 21.719 ni ninguna otra ley o norma.

El acuerdo también señala que no se comprobó en una fuente oficial el ancla normativa que podría corresponder a este proyecto. No nombra otra autoridad jurídica. Este repositorio no es una revisión hecha por una persona competente en derecho y no informa que una persona competente haya revisado el tratamiento jurídico del proyecto.

## Tres niveles de verificación

**Integridad del registro local: demostrada con una frontera.** Un proceso aparte recalcula el digest de cada recibo y la huella de cada línea del registro con los datos suministrados mediante las funciones criptográficas integradas de Node. Su prueba corre sin cargar Cátedra ni Vespi. Un resultado coincidente muestra que el registro local entregado conserva esos valores de integridad. No revela quién escribió el registro ni si lo que declara es cierto.

**Firma de la nota: demostrada con una reserva sobre custodia.** La nota se firma con ed25519 sobre su contenido y se comprueba contra una clave pública registrada. En esta demostración, la clave privada del profesor está guardada junto al registro. Por eso la firma vincula el contenido con una clave, pero no establece la identidad civil de quien la controlaba. En un contexto real habría que resolver aparte la custodia de la clave privada y la publicación de la clave pública; el proyecto no valida ese arreglo.

**Emisión del título fuera del proyecto: no verificada.** El anclaje del título sigue en `pending`. No hay hash de testnet, identificador de transacción ni entrada en un explorador público. Una persona sin este programa y sin este registro local no tiene un lugar público que consultar. El acuerdo considera insuficiente para su afirmación central que el título solo se pueda verificar mediante este programa, así que el proyecto no presenta esa afirmación como demostrada.

## Lo que el proyecto no afirma

- No afirma cumplir la Ley 21.719, otra ley ni una norma.
- No prueba que una declaración de uso de IA sea sustancialmente exacta o completa. La declaración se exige como campo, pero no se comprueba su veracidad.
- No establece que una clave pertenezca al profesor nombrado en la compuerta de firmantes. La compuerta del kernel cuenta el nombre ingresado; la capa de firma criptográfica separada de Cátedra puede rechazar una firma inválida, pero el recibo del kernel aún puede conservar ese nombre.
- No establece que una institución real haya adoptado el sistema, dado permiso o esté afiliada con la universidad ficticia. No se reclama afiliación con la UAI, el Laboratorio Blockchain UAI, TECHO ni otro tercero.
- No demuestra que el título exista fuera de la demostración local ni que un lector externo pueda verificarlo de forma independiente.
- No acredita preparación para uso institucional real ni describe un producto terminado.

Las personas, asignaturas y características institucionales de la demostración son de fantasía. Los materiales del proyecto indican que usa datos sintéticos y que no contiene datos reales personales, de salud, financieros ni de terceros.

## Preguntas para un posible uso real futuro

El proyecto deja estas preguntas abiertas; no son conclusiones sobre la ley aplicable ni sobre la práctica institucional:

- ¿Qué requisitos jurídicos, de privacidad e institucionales aplicarían a un despliegue real?
- ¿Qué comprobaciones de identidad, custodia de claves y aprobaciones humanas se necesitarían?
- ¿Qué mecanismo externo podría permitir una verificación independiente y qué demostraría con precisión?
- ¿Cómo deberían funcionar la conservación, el acceso, la corrección y la eliminación de un registro académico real?

Responderlas requeriría una revisión jurídica e institucional adecuada y evidencia del mecanismo externo de verificación que se eligiera. Esta demostración no aporta ninguna de las dos.
