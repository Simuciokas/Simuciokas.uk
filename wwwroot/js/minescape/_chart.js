// chart.js setup, isolated in its own module so that:
//   (a) the static named imports below are tree-shakable by esbuild
//       (the previous pattern `await import('chart.js')` then `cjs.X`
//       defeats tree-shaking because namespace access is opaque), and
//   (b) ge.js can still dynamic-import this whole file to keep the chart
//       libraries out of the main bundle.

import {
    Chart,
    TimeScale,
    LinearScale,
    CategoryScale,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import 'chartjs-adapter-luxon';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import zoom from 'chartjs-plugin-zoom';

Chart.register(
    TimeScale,
    LinearScale,
    CategoryScale,
    Title,
    Tooltip,
    Legend,
    CandlestickController,
    CandlestickElement,
    zoom
);

export { Chart };
