"""probar.py — sonda de los gráficos del Monitor Laboral con la medición del molde (populi-marca/monitor/pruebas/auditar.py).

    python -I probar.py [nombres…] [--fotos] [--tema=dark] [--anchos=356,1214]

Requiere `python -m http.server 8123 --bind 127.0.0.1` en Proyectos/ y Playwright con Chrome.
Imprime por gráfico y ancho: errores de consola, solapes, textos fuera del lienzo, trazado/lienzo, cifras, tooltip, alto.
Las fotos (--fotos) son sólo para mirar el diseño; los números salen en texto.
"""
import json, re, sys
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")
AQUI = Path(__file__).resolve().parent
SONDA = re.search(r'SONDA = r"""(.*?)"""', (AQUI.parents[1] / "populi-marca/monitor/pruebas/auditar.py").read_text(encoding="utf-8"), re.S).group(1)
BASE = "http://127.0.0.1:8123/populi-laboral/embed/"
args = [a for a in sys.argv[1:] if not a.startswith("--")]
TODOS = ["desocupacion", "informalidad", "ingresos", "departamentos", "sectores", "actividades_paneles", "estructura", "flujos"]
nombres = args or [n for n in TODOS if (AQUI.parent / "embed" / f"{n}.html").exists()]
fotos = "--fotos" in sys.argv
tema = next((a.split("=", 1)[1] for a in sys.argv if a.startswith("--tema=")), "light")
anchos = [int(x) for x in next((a.split("=", 1)[1] for a in sys.argv if a.startswith("--anchos=")), "356,1214").split(",")]
OUT = AQUI / "_salida"; OUT.mkdir(exist_ok=True)
res = {}
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True)
    for n in nombres:
        for w in anchos:
            movil = w < 600
            ctx = b.new_context(viewport={"width": w, "height": 1000}, device_scale_factor=1, is_mobile=movil, has_touch=movil)
            pg = ctx.new_page(); err = []
            pg.on("pageerror", lambda e: err.append(f"pageerror: {e}"))
            pg.on("console", lambda m: err.append(f"console.{m.type}: {m.text}") if m.type in ("error", "warning") else None)
            pg.goto(BASE + n + ".html" + ("?tema=dark" if tema == "dark" else ""), wait_until="networkidle", timeout=90000)
            pg.wait_for_timeout(2200)
            try:
                r = pg.evaluate(SONDA)
            except Exception as e:
                r = {"err": str(e)}
            r["errores"] = err[:6]
            res[f"{n}@{w}"] = r
            if fotos:
                pg.evaluate("window.scrollTo(0,0)")
                pg.screenshot(path=str(OUT / f"{n}_{w}{'_dark' if tema == 'dark' else ''}.png"), full_page=True)
            ctx.close()
            ch = (r.get("charts") or [{}])
            linea = []
            for c in ch:
                linea.append(f"lienzo {c.get('lienzoW')}x{c.get('lienzoH')} trazado {c.get('plotW')} ({round(100 * (c.get('plotW') or 0) / max(1, c.get('lienzoW') or 1))} %) "
                             f"solapes {c.get('nSolapes')} {c.get('solapes') or ''} fuera {c.get('fueraLienzo') or ''} x:{(c.get('ejes') or {}).get('xAxis', {}).get('muestra')}")
            print(f"== {n} @{w} {tema}: alto {r.get('altoPlegado')}/{r.get('altoAbierto')} desborde {r.get('scrollW', 0) - r.get('vw', 0)} radios {r.get('radios')} errores {r['errores'] or 'no'}")
            for l in linea: print("   ", l)
            print("    kpi:", r.get("kpi"), "\n    panel:", r.get("panelFecha"), "| tooltip:", [c.get("tooltip") for c in ch])
    b.close()
(OUT / f"sonda_{tema}.json").write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")
