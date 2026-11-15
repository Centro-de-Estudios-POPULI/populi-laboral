"""estados.py — aprieta cada botón de las botoneras y prueba cada opción de los selectores, en cada gráfico.
Uso: python -I estados.py [--anchos=356,1214]. Reporta errores de página, desborde y gráficos vacíos por estado."""
import sys
from playwright.sync_api import sync_playwright
sys.stdout.reconfigure(encoding="utf-8")
B = "http://127.0.0.1:8123/populi-laboral/embed/"
G = ["desocupacion", "informalidad", "ingresos", "departamentos", "sectores", "actividades_paneles", "estructura", "flujos"]
anchos = [int(x) for x in next((a.split("=", 1)[1] for a in sys.argv if a.startswith("--anchos=")), "356,1214").split(",")]
CHEQUEO = """() => { const vw = document.documentElement.clientWidth, el = document.querySelector('[_echarts_instance_]');
  const inst = el && echarts.getInstanceByDom(el), o = inst && inst.getOption();
  const nSer = o ? o.series.filter(s => (s.data || []).some(v => v != null && (typeof v !== 'object' || v.value != null))).length : 0;
  return { desborde: document.documentElement.scrollWidth - vw, series: nSer, panel: (document.getElementById('panel') || {}).innerText ? 1 : 0 }; }"""
total = malos = 0
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True)
    for w in anchos:
        for g in G:
            ctx = b.new_context(viewport={"width": w, "height": 900}, is_mobile=w < 600, has_touch=w < 600)
            pg = ctx.new_page(); err = []
            pg.on("pageerror", lambda e: err.append(str(e)))
            pg.goto(B + g + ".html", wait_until="networkidle"); pg.wait_for_timeout(1500)
            pasos = []
            for i in range(pg.locator(".hz-btn").count()):
                bt = pg.locator(".hz-btn").nth(i); t = bt.inner_text()
                if not bt.is_visible(): continue
                bt.click(); pg.wait_for_timeout(250); pasos.append(("btn " + t, pg.evaluate(CHEQUEO)))
            for j in range(pg.locator("select.sel-l").count()):
                s = pg.locator("select.sel-l").nth(j)
                for v in s.evaluate("e => [...e.options].map(o => o.value)"):
                    s.select_option(v); pg.wait_for_timeout(200); pasos.append((f"sel{j}={v}", pg.evaluate(CHEQUEO)))
            for i in range(pg.locator(".pill").count()):
                pg.locator(".pill").nth(i).click(); pg.wait_for_timeout(150); pasos.append(("pill", pg.evaluate(CHEQUEO)))
            mal = [(n, r) for n, r in pasos if r["desborde"] > 0 or r["series"] == 0 or not r["panel"]]
            total += len(pasos); malos += len(mal) + len(err)
            print(f"{g}@{w}: {len(pasos)} estados · errores {err[:2] or 'no'} · con problema {mal[:4] or 'ninguno'}", flush=True)
            ctx.close()
    b.close()
print(f"TOTAL {total} estados, {malos} con problema")
