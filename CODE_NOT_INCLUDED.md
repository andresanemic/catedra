# Code not included

This public repository publishes the project explanation, captured test evidence, legal and verification limits, cover art, and review conditions. It does not include Cátedra's source code. The README and evidence page describe the behavior from the written agreement, phase record, package metadata, and captured suite. They are not a substitute for inspecting the implementation.

The project is being published for Find Your Way and Meridian judges and the community to review before the code opens. The planned release is during the judges' review period under the review-only terms in [LICENSE](LICENSE). No calendar date is specified here. Read the license itself for its conditions; this page does not alter or summarize away its terms.

## What can be reviewed now

- The project's scope, actors, grants, walkthrough rules, and stated boundaries in [How it works](docs/HOW_IT_WORKS.md).
- The captured suite result, test names, adversarial findings, and historical run distinction in [Evidence](docs/EVIDENCE.md).
- The legal and verification claims the demonstration does not make in [Legal and limits](docs/LEGAL_AND_LIMITS.md).
- The release terms in [LICENSE](LICENSE).

The source materials define `npm test` and `node src/recorrido.js` as ways to run the suite and terminal walkthrough after the source is available. Those commands cannot be run from this public repository as it stands because their source files are absent. The current captured suite result is documented in [Evidence](docs/EVIDENCE.md).

## When the source opens

The code is intended to be available for reading and cloning to evaluate during the judges' review period, under the review-only license. Reviewers can then compare the implementation with the agreement, inspect the receipt and verifier paths, and reproduce the tests. The current kernel digest mismatch must be considered when assessing a future run; the project needs an explicit re-pin and fresh evidence before claiming a green suite against the installed kernel.

---

# Código no incluido

Este repositorio público ofrece la explicación del proyecto, la evidencia capturada de pruebas, los límites jurídicos y de verificación, la portada y las condiciones de revisión. No incluye el código fuente de Cátedra. El README y la página de evidencia describen el comportamiento según el acuerdo escrito, el registro de fases, los metadatos del paquete y la suite capturada. No reemplazan la revisión de la implementación.

El proyecto se publica para que los jueces de Find Your Way y Meridian y la comunidad puedan revisarlo antes de que se abra el código. La publicación está prevista durante el periodo de revisión de los jueces bajo las condiciones de solo revisión de [LICENSE](LICENSE). Aquí no se especifica una fecha calendario. Lee la licencia para conocer sus condiciones; esta página no las modifica ni sustituye.

## Qué se puede revisar ahora

- El alcance, los actores, los grants, las reglas del recorrido y los límites declarados en [Cómo funciona](docs/HOW_IT_WORKS.md).
- El resultado capturado de la suite, los nombres de pruebas, los hallazgos adversariales y la distinción frente a la corrida histórica en [Evidencia](docs/EVIDENCE.md).
- Las afirmaciones jurídicas y de verificación que la demostración no hace en [Marco legal y límites](docs/LEGAL_AND_LIMITS.md).
- Las condiciones de publicación en [LICENSE](LICENSE).

Los materiales fuente definen `npm test` y `node src/recorrido.js` como formas de ejecutar la suite y el recorrido de terminal cuando el código esté disponible. Hoy no se pueden ejecutar desde este repositorio público porque faltan sus archivos fuente. El resultado capturado actual está documentado en [Evidencia](docs/EVIDENCE.md).

## Cuando se abra el código

El código está previsto para lectura y clonación con fines de evaluación durante el periodo de revisión de los jueces, bajo la licencia de solo revisión. Entonces se podrá comparar la implementación con el acuerdo, inspeccionar el recorrido de recibos y verificador, y repetir las pruebas. Al evaluar una corrida futura habrá que considerar la diferencia actual de digest del kernel; hace falta una nueva fijación explícita y evidencia reciente antes de afirmar que la suite pasa contra el kernel instalado.
