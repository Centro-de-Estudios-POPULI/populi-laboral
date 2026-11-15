# Monitor Laboral · Centro de Estudios POPULI

Mercado laboral de Bolivia desde el microdato de la **Encuesta Continua de Empleo (ECE)** del INE, 4T-2015 en adelante.
Mismo molde que los demás monitores (`populi-marca/monitor/`, copiado en `embed/comun/` por `sincronizar.py`).

## Gráficos (`embed/`)

| Archivo | Qué muestra |
|---|---|
| `desocupacion.html` | Desocupación, subutilización amplia (LU3, LU4 de la OIT) y subocupación por horas, por trimestre |
| `informalidad.html` | Ocupación informal y sector informal (metodología INE); seguro de salud de los asalariados y aporte a la Gestora |
| `ingresos.html` | Ingreso laboral mediano real (Bs del 1T-2026) por sexo, formalidad y categoría; ocupados bajo el salario mínimo |
| `departamentos.html` | Mapa + ranking de los 9 departamentos (7 indicadores), año completo o año móvil, total o urbano |
| `sectores.html` | Las 14 ramas de actividad por departamento: empleo, informalidad, ingreso, mujeres, horas |
| `actividades_paneles.html` | Paneles múltiples: empleo e ingreso real de cada rama en el tiempo (promedio de 4 trimestres, año base = 100 o crecimiento), Bolivia, urbano, rural y el eje |
| `estructura.html` | Composición de los ocupados por categoría, tamaño del establecimiento y sector |
| `flujos.html` | Transiciones entre trimestres con el panel (sólo área urbana): salidas, entradas, formal ↔ informal |

`laboral.js` y `laboral.css`: piezas propias de este monitor (ámbitos, sombreado de trimestres preliminares, selector).
`index.html`: página de aterrizaje con los gráficos (alto automático, protocolo POPULI).
`metodologia.html`: metodología para el lector; sus cifras salen de `data/metodologia.json` (ninguna escrita a mano).

**2T-4T 2020 (sin encuesta rural):** Bolivia y el área rural llevan una **estimación POPULI** en línea punteada con su
intervalo de 95 % (modelo estructural de señal + ruido; `populi-mercado-laboral/scripts/12_hueco_2020.py`,
`metodologia.html#hueco-2020`). La serie oficial queda vacía en `data/trimestral.json`; la estimación va en `estimados`.

## Datos (`data/`)

Los genera `populi-mercado-laboral/scripts/11_datos_monitor.py` desde el catálogo de indicadores calculado con el
microdato (no hay scraper: el microdato se procesa en la máquina local). `bolivia.geojson` viene de `populi-inflacion`.
Los trimestres más recientes que todavía no tienen microdato salen de los **cuadros preliminares del INE** (sólo las
tasas que el INE publica) y van marcados `(p)` y sombreados.

## Actualizar (cada trimestre)

1. En `populi-mercado-laboral`: `bash scripts/00_correr_todo.sh` (baja el trimestre nuevo, valida, recalcula y escribe `data/` aquí).
2. Probar: `python -m http.server 8123 --bind 127.0.0.1` en `Proyectos/` y `python -I pruebas/probar.py` + `pruebas/estados.py`.
