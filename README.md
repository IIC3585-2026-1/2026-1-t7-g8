# Crypto Live — Dashboard de criptomonedas en vivo con Astro Islands

Tarea **t7** del curso **Diseño Avanzado de Aplicaciones Web**. Consiste en una página estática desarrollada con **Astro** que integra dos islas interactivas: un panel de filtros implementado en **Vue** y un visualizador de precios en tiempo real desarrollado con **Svelte**, alimentado mediante el WebSocket de Binance.

```text
┌───────────────────────────────────────────────────────────┐
│   Astro (HTML estático + obtención de metadatos en build) │
│                                                           │
│   ┌─────────────────────┐    ┌────────────────────────┐   │
│   │ Vue (client:load)   │ ─▶ │ Svelte (client:visible)│   │
│   │ Filtros y búsqueda  │  ▲ │ WebSocket + Chart.js   │   │
│   └─────────────────────┘  │ └────────────────────────┘   │
│        window CustomEvent('crypto:selection-changed')     │
└───────────────────────────────────────────────────────────┘
```

## Inicio rápido

```sh
npm install
npm run dev      # http://localhost:4321
```

### Build local

```sh
npm install
npm run build    # Genera el sitio estático en ./dist
npm run preview  # Sirve localmente la versión compilada (debes ejecutar run build antes)
```

**Importante:** Se requiere **Node.js 22.12 o superior**, configurado en la sección `engines` del `package.json`.

**Nota:** Durante el desarrollo, es posible que la API de CoinGecko retorne errores 429 (Too Many Requests) debido a sus límites de rate limiting en el plan gratuito. Esto puede provocar que algunos metadatos de criptomonedas no se carguen en modo desarrollo (como las imágenes por ejemplo). La aplicación sigue funcionando normalmente, ya que este paso es opcional y no afecta la funcionalidad principal de las islas ni el flujo en tiempo real de precios desde Binance.

## Estructura del proyecto

| Capa | Archivos | Función |
|------|----------|---------|
| **Astro** | `src/pages/index.astro`, layouts | Renderiza la estructura estática del sitio y obtiene los metadatos de las criptomonedas desde CoinGecko durante el proceso de compilación. |
| **Vue** | `src/components/CryptoFilter.vue` | Implementa el panel de búsqueda y selección de criptomonedas. Mantiene el estado de la selección, lo guarda en `localStorage` y notifica los cambios al resto de la aplicación. |
| **Svelte** | `src/components/PriceTicker.svelte` | Escucha los cambios de selección, obtiene el historial inicial desde la API REST de Binance, genera los gráficos con Chart.js y actualiza los precios en tiempo real mediante WebSockets. |
| **Compartido** | `src/lib/island-bus.ts` | Define los eventos y tipos utilizados para la comunicación entre las islas. |
| **Compartido** | `src/lib/coins.ts` | Contiene el catálogo estático de criptomonedas (símbolos, pares de Binance e identificadores de CoinGecko). |

## Tecnologías utilizadas

- Astro 6
- Vue 3.5
- Svelte 5 (Runes)
- Tailwind CSS v4
- Chart.js 4
- TypeScript (modo estricto)

## Uso de IA

Durante el desarrollo de este proyecto se utilizó IA como herramienta de apoyo en distintas etapas del proceso, principalmente como asistente técnico y de documentación. Su uso no reemplazó el trabajo de implementación, sino que facilitó la comprensión y aceleró ciertas decisiones de diseño.

En particular, se utilizó IA para:

- El diseño de la estructura y estilos de la página (HTML y CSS), especialmente en la organización general del layout, la disposición de componentes y el estilo para que todo se viera bien.
- Resolver dudas relacionadas con el funcionamiento del framework Astro, en especial el concepto de islas y sus distintos modos de hidratación.
- Entender e integrar correctamente la comunicación entre componentes de distintas tecnologías (Vue y Svelte) dentro del ecosistema de Astro.
- Generar la documentación del proyecto, incluyendo la redacción de este README y explicaciones técnicas de las decisiones tomadas.

En todos los casos, las soluciones propuestas por la IA fueron revisadas, adaptadas e integradas manualmente en el proyecto.

## Autoevaluación

Como equipo consideramos que el proyecto cumple adecuadamente con los requisitos establecidos en el entregable. Se logró implementar una aplicación funcional que integra correctamente Astro con islas interactivas en Vue y Svelte, incluyendo comunicación entre componentes, uso de WebSockets y consumo de APIs externas en tiempo real.

A pesar del corto tiempo disponible para la entrega, se consiguió un buen entendimiento general del framework y de su modelo de renderizado, así como de la integración entre distintas tecnologías frontend modernas.

Sin embargo, identificamos algunos aspectos que podrían haberse mejorado, especialmente la planificación del trabajo y la división de tareas dentro del equipo. Una mejor coordinación inicial habría permitido avanzar de forma más paralela y con menos fricción en la integración final. Atribuímos esto a que estamos terminando el semestre, por lo que la carga academica está bastante alta.