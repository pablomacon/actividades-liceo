# Guía docente — Bucles en EduBlocks

**Ciencias de la Computación · 7.º EBI · 2026**

## 1. Presentación de la unidad

**Pregunta inicial:** ¿Cómo podemos hacer que una computadora repita instrucciones sin escribirlas muchas veces?

La propuesta introduce la estructura de repetición `for` mediante una situación que los estudiantes pueden resolver con sus conocimientos anteriores: escribir varias instrucciones `print()`.

A partir de ese problema, descubren la utilidad de los bucles, exploran el significado de `range(n)`, construyen programas en EduBlocks y comprueban individualmente lo aprendido.

**Conocimientos previos:** `print()`, `input()`, `int()`, variables y condicionales.

**Contenidos centrales:** repetición, `for`, `range(n)`, instrucciones interiores, vueltas del bucle, valores de la variable y salida del programa.

**No introducir todavía:** `while`, `break` ni listas.

## 2. Metas de aprendizaje esperadas

Se espera que los estudiantes:

1. Reconozcan situaciones en las que conviene repetir instrucciones.
2. Interpreten que `range(n)` establece una cantidad de repeticiones y que los valores de la variable comienzan en cero.
3. Predigan la salida de programas sencillos que utilizan `for`.
4. Construyan y prueben una repetición en EduBlocks, utilizando los apoyos necesarios.
5. Identifiquen y corrijan errores simples, especialmente la ubicación de instrucciones dentro o fuera del bucle.

## 3. Organización sugerida

Grupo de aproximadamente 30 estudiantes, trabajando en duplas con las computadoras disponibles.

| Encuentro | Duración estimada | Actividad principal                                        |
| --------- | ----------------- | ---------------------------------------------------------- |
| 1         | 45 minutos        | Descubrimiento colectivo y exploración inicial             |
| 2         | 90 minutos        | Simulador, taller diferenciado y construcción en EduBlocks |
| 3         | 45 minutos        | Depuración, recuperación y comprobación individual         |

Los tiempos son orientativos. Puede ampliarse el taller si los estudiantes necesitan más oportunidades de construcción y prueba.

## 4. Rutina de aula

**Entrada — 5 minutos**

- Ingresar a la web y seleccionar grupo y estudiante.
- Recuperar los conocimientos sobre `print()`.
- Presentar el problema de escribir «Hola» varias veces.

**Señal de atención**

El docente pregunta: «¿Qué se repite?».

El grupo responde: «La instrucción de adentro».

A continuación, todos dejan de utilizar el teclado y miran la explicación.

**Trabajo en duplas**

- **Piloto:** manipula los bloques, ejecuta el programa y realiza modificaciones.
- **Navegante:** lee la consigna, anticipa los resultados y comprueba lo que sucede.

Intercambiar los roles aproximadamente a mitad del taller o al cambiar de actividad.

**Cierre — ticket de salida**

Cada estudiante completa:

1. `for` sirve para ********\_\_********.
2. `range(3)` indica **\_\_** vueltas.
3. Algo que corregí o comprendí hoy fue ********\_\_********.

## 5. Desarrollo de las cuatro etapas

### Etapa 1. Descubrimos — Inicio colectivo

**Modalidad:** trabajo colectivo dirigido por el docente.

La página presenta cinco instrucciones `print("Hola")`.

Los estudiantes ejecutan el programa y observan el resultado. Después responden cómo podrían simplificarlo si necesitaran mostrar treinta mensajes.

Solo después de elegir una respuesta se revela la solución con `for`.

**Imagen principal:** `bucles-8.png`.

**Intervención docente sugerida:**

- ¿Qué tienen en común las cinco instrucciones?
- ¿Qué cambiaría si necesitáramos cien mensajes?
- ¿Qué ventaja tiene escribir una instrucción y repetirla?

**Evidencia observable:** reconoce la acción repetida y explica por qué utilizaría una estructura de repetición.

### Etapa 2. Exploramos — Comprendemos el funcionamiento

**Modalidad:** explicación breve y experimentación guiada.

Se utilizan las imágenes de la categoría Loops, la estructura del bloque `for` y la ubicación de las instrucciones interiores.

Después, los estudiantes predicen cuántas veces aparecerá «Hola» con `range(4)`.

El simulador permite elegir entre una y diez vueltas, avanzar, retroceder y reiniciar. Muestra el número de vuelta, el valor de `i` y la salida acumulada.

**Imágenes de apoyo:** `bucles-1.png`, `bucles-2.png`, `bucles-3.png`, `bucles-9.png`, `bucles-10.png` y `bucles-11.png`.

**Intervención docente sugerida:**

- ¿Cuántas vueltas realiza `range(5)`?
- ¿Cuál es el primer valor de `i`?
- ¿Qué aparece en la consola durante cada vuelta?
- ¿Por qué cinco vueltas no significan necesariamente imprimir los números del 1 al 5?

**Evidencia observable:** relaciona cantidad de vueltas, valor de la variable y salida.

### Etapa 3. Construimos — Taller diferenciado

**Modalidad:** trabajo en duplas, con piloto y navegante.

Se ofrecen tres recorridos sobre el mismo concepto. Los estudiantes pueden cambiar de recorrido si necesitan más orientación o desean mayor autonomía.

**Recorrido Inicial — Construyo con ayuda**

- Observa un ejemplo con bloques.
- Completa el valor de `range()` para mostrar «Hola» cinco veces.
- Recibe pistas graduales.
- Construye el programa en EduBlocks utilizando la referencia visual.

**Qué entregar:** programa probado en EduBlocks y explicación oral de qué se repite.

**Recorrido Guiado — Construyo paso a paso**

- Busca el bloque `for` en Loops.
- Establece cuatro repeticiones.
- Coloca `print("Hola")` dentro.
- Predice el resultado, ejecuta y comprueba.

**Qué entregar:** programa construido y explicación de la cantidad de repeticiones.

**Recorrido Desafío — Resuelvo con autonomía**

- Solicita una cantidad mediante `input()`.
- La convierte mediante `int()`.
- Utiliza esa cantidad en `range()`.
- Prueba el programa con 2, 4 y 6 repeticiones.

**Qué entregar:** programa que responda a distintas cantidades y explicación de la variable utilizada.

**Importante:** los recorridos no son etiquetas permanentes de rendimiento. Son caminos de aprendizaje con diferentes apoyos.

La web registra las pistas consultadas, pero utilizarlas no constituye un error ni una penalización.

### Actividad de depuración — Encuentra el error

La actividad presenta `bucles-6-1.png`, con una instrucción `print(i)` fuera del bucle.

El estudiante debe decidir qué modificación permite imprimir los números del 1 al 5.

Después de responder, se revela `bucles-6-2.png`, que explica la corrección.

**Aclaración conceptual importante:** en Python, si ejecutamos `for i in range(1, 6):` y luego `print(i)` fuera del bucle, se imprime únicamente `5`. No se produce un `NameError`, porque la variable conserva su último valor.

La diferencia que queremos enseñar es entre ejecutar `print(i)` en cada vuelta o ejecutarlo una sola vez después de terminar la repetición.

**Evidencia observable:** identifica que la ubicación de `print()` modifica el comportamiento del programa.

### Etapa 4. Comprobamos — Trabajo individual

La comprobación tiene tres preguntas comunes para todos los recorridos:

1. Reconocer para qué sirve `for`.
2. Predecir la salida de `range(3)`.
3. Reconocer la ausencia de los dos puntos en una estructura `for`.

**Clave docente:** 1-a, 2-b, 3-a.

La web envía la comprobación al sistema existente de resultados. El estudiante puede continuar practicando después de entregar, pero no debe realizar una segunda entrega sin una nueva habilitación.

La entrega registrada aporta evidencia de las respuestas, no constituye por sí sola una calificación definitiva ni acredita que el programa construido en EduBlocks haya sido verificado automáticamente.

## 6. Lista de cotejo formativa

Marcar cada indicador durante la circulación por las duplas.

- [ ] Reconoce una instrucción que conviene repetir.
- [ ] Relaciona `range(n)` con la cantidad de vueltas.
- [ ] Predice la salida de un programa con `for`.
- [ ] Construye o completa un bucle colocando la instrucción en su interior.
- [ ] Identifica un error y propone una corrección.

No es necesario registrar los cinco indicadores de todos los estudiantes en cada clase. Seleccionar dos o tres observables prioritarios según el momento.

## 7. Rúbrica breve

| Nivel             | Reconoce la repetición                           | Predice y explica                                              | Construye o corrige                           |
| ----------------- | ------------------------------------------------ | -------------------------------------------------------------- | --------------------------------------------- |
| **4. Transfiere** | Identifica y justifica cuándo conviene repetir.  | Explica vueltas, variable y salida, y anticipa modificaciones. | Construye y adapta un programa con autonomía. |
| **3. Comprende**  | Reconoce la instrucción repetida.                | Predice correctamente una salida sencilla.                     | Construye o corrige y verifica el resultado.  |
| **2. En proceso** | Reconoce la repetición con ejemplos o preguntas. | Predice con ayuda del simulador o una pista.                   | Completa una estructura con apoyos.           |
| **1. Inicio**     | Necesita modelado para reconocer la repetición.  | Requiere acompañamiento vuelta por vuelta.                     | Necesita un ejemplo visible y guía directa.   |

Esta rúbrica orienta la retroalimentación y las próximas intervenciones. No debe utilizarse para penalizar el uso de apoyos.

## 8. Evidencias mínimas en un minuto

Durante la circulación, el docente puede pedir a un estudiante que:

1. Señale cuál es la instrucción que se repite.
2. Diga cuántas vueltas hace `range(4)`.
3. Explique qué cambió al colocar `print()` dentro del `for`.

Registrar las respuestas mediante tres marcas rápidas: logrado, en proceso o requiere apoyo.

No es necesario corregir capturas de pantalla ni revisar visualmente todos los programas durante la misma clase.

## 9. Reenseñanza y recuperación

Si un estudiante todavía no comprende la repetición:

1. Volver al ejemplo de cinco instrucciones `print()`.
2. Representar cada ejecución mediante una tarjeta o marca.
3. Agruparlas bajo una instrucción de repetición.
4. Utilizar el simulador, avanzando una vuelta por vez.
5. Reconstruir el programa con el recorrido Inicial.

La recuperación es una nueva oportunidad de comprensión, no un castigo ni una actividad adicional por haber cometido errores.

Para quienes terminan antes, proponer una modificación de la cantidad de repeticiones o una comparación entre `range(5)` y `range(1, 6)`.

## 10. Plan B desenchufado

Si no hay conexión o EduBlocks no está disponible, trabajar con tarjetas, papel y lápiz.

**Consigna**

1. Escribe una instrucción para mostrar «Hola».
2. Representa cinco repeticiones mediante cinco casillas.
3. Explica cuántas vueltas indica `range(4)`.
4. Rodea cuál es la instrucción que debe estar dentro del bucle.

**Qué entregar:** ficha con las vueltas, la instrucción repetida y las respuestas.

Para mayor apoyo, entregar las casillas ya dibujadas y las instrucciones recortadas. Para desafío, pedir que representen una cantidad variable de repeticiones.

## 11. Ciudadanía digital y uso responsable de IA

- Cada estudiante debe seleccionar únicamente su propio nombre.
- No se deben consultar ni modificar respuestas de otros estudiantes.
- No compartir datos personales, credenciales o información del grupo en servicios externos.
- Las herramientas de IA, si son utilizadas bajo indicación docente, pueden ofrecer explicaciones o pistas, pero no deben sustituir la comprensión ni resolver la comprobación individual.
- El estudiante debe poder explicar el programa que construyó.

EduBlocks es un entorno externo de práctica. Nuestra página no inspecciona automáticamente el programa creado allí.

## 12. Acompañamiento de practicantes

**Roles posibles**

- Docente: conduce el inicio colectivo, regula los tiempos y realiza intervenciones conceptuales.
- Practicante 1: acompaña duplas que utilizan apoyos y registra dificultades frecuentes.
- Practicante 2: observa las predicciones, acompaña el desafío y recoge evidencias de autonomía.

**Guion breve de intervención**

1. Preguntar: «¿Qué quieres que haga el programa?».
2. Solicitar una predicción antes de ejecutar.
3. Pedir que señale cuál instrucción se repite.
4. Ofrecer una pista, sin construir directamente la solución.
5. Invitar a probar y explicar el resultado.

**Checklist de observación**

- [ ] Comprende la consigna sin explicaciones reiteradas.
- [ ] Distingue las instrucciones interiores del bucle.
- [ ] Realiza al menos una predicción.
- [ ] Utiliza pistas o ejemplos de manera pertinente.
- [ ] Participa en el intercambio de roles.

**Plantilla de devolución al practicante**

**Fortaleza 1:** ************\_\_************

**Fortaleza 2:** ************\_\_************

**Próximo paso 1:** **********\_\_**********

**Próximo paso 2:** **********\_\_**********

## 13. Verificaciones técnicas antes de habilitar

Comprobar en el entorno real:

- Carga de grupos y estudiantes.
- Habilitación de la unidad desde el sistema docente.
- Navegación entre las cuatro etapas.
- Funcionamiento de los tres recorridos.
- Ejecución del simulador.
- Visualización de imágenes desde `assets/`.
- Ocultamiento inicial de la solución de depuración.
- Apertura de EduBlocks.
- Envío de una comprobación mediante un estudiante de prueba.
- Consulta del resultado desde el panel docente.

**No habilitar la actividad a los grupos hasta haber comprobado el registro de una entrega de prueba.**

## 14. Criterio de cierre de la unidad

Considerar que el estudiante ha logrado las metas principales cuando puede reconocer una repetición, anticipar el comportamiento de un `for` sencillo y construir o corregir un programa con los apoyos que necesite.

La comprobación digital es una evidencia entre varias: también cuentan las explicaciones orales, las predicciones, la observación del trabajo y las producciones realizadas en EduBlocks o en papel.
