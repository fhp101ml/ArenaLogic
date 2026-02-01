
coincidencia patillas con entradas
cuando acabe la ronda quiero que tambien informe de si ha ganado o perdido y también un resumen de los resultados y la tabla de resultados hasta esa ronda.


____________________________________________________________________________


https://chatgpt.com/share/697e4384-9268-800d-ab8f-677f3ceb2c01

1) Playwright (recomendación general)

Interactúa con navegador (Chromium/Chrome, Firefox, WebKit).

Accede al DOM con selectores (CSS/XPath/roles), ejecuta JS (page.evaluate), escribe en inputs (fill, type), clicks, etc.

Muy buena gestión de esperas (SPAs).

Python (ejemplo básico)

from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
    page.goto("https://example.com")

    # escribir en un input
    page.fill("input[name='q']", "hola mundo")

    # click en un botón
    page.click("button[type='submit']")

    browser.close()

2) Selenium (clásico / muy extendido)

Funciona con WebDriver (ChromeDriver/GeckoDriver, etc.).

Muy usado en entornos corporativos y testing legacy.

En SPAs a veces necesitas más “esperas explícitas” que en Playwright.

3) Puppeteer (Node.js, muy popular)

Orientado a Chrome/Chromium.

Excelente si tu stack es JavaScript/TypeScript.
