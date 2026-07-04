import seedrandom from 'seedrandom';
import { type SnapperConfig } from '../../shared/objects';

export function quantizeImage(width: number, height: number, rgba: Uint8Array, config: SnapperConfig): Uint8Array {
    const opaquePixels: [number, number, number, number][] = [];
    for (let i = 0; i < rgba.length; i += 4) {
        if (rgba[i + 3] !== 0) opaquePixels.push([rgba[i], rgba[i + 1], rgba[i + 2], rgba[i + 3]]);
    }

    if (opaquePixels.length === 0) return rgba;

    const rng = seedrandom(config.kSeed.toString());
    const k = Math.min(config.kColors, opaquePixels.length);
    const distSq = (p: number[], c: number[]): number => (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;

    const centroids: [number, number, number, number][] = [
        opaquePixels[Math.floor(rng() * opaquePixels.length)]
    ];
    const distances = new Float32Array(opaquePixels.length).fill(Infinity);

    for (let currentK = 1; currentK < k; currentK++) {
        const lastC = centroids[centroids.length - 1];
        let sumSqDist = 0;

        for (let i = 0; i < opaquePixels.length; i++) {
            const dSq = distSq(opaquePixels[i], lastC);
            if (dSq < distances[i]) distances[i] = dSq;
            sumSqDist += distances[i];
        }

        if (sumSqDist <= 0) centroids.push(opaquePixels[Math.floor(rng() * opaquePixels.length)]);
        else {
            let target = rng() * sumSqDist;
            let chosenIdx = opaquePixels.length - 1;
            for (let i = 0; i < distances.length; i++) {
                target -= distances[i];
                if (target <= 0) {
                    chosenIdx = i;
                    break;
                }
            }
            centroids.push(opaquePixels[chosenIdx]);
        }
    }

    let prevCentroids = JSON.parse(JSON.stringify(centroids));
    for (let iter = 0; iter < config.maxKmeansIterations; iter++) {
        const sums: [number, number, number][] = Array.from({ length: k }, () => [0, 0, 0]);
        const counts = new Array<number>(k).fill(0);

        for (const p of opaquePixels) {
            let minDist = Infinity;
            let bestK = 0;
            for (let i = 0; i < k; i++) {
                const d = distSq(p, centroids[i]);
                if (d < minDist) { minDist = d; bestK = i; }
            }
            sums[bestK][0] += p[0]; sums[bestK][1] += p[1]; sums[bestK][2] += p[2];
            counts[bestK]++;
        }

        let maxMovement = 0;
        for (let i = 0; i < k; i++) {
            if (counts[i] > 0) {
                centroids[i] = [sums[i][0] / counts[i], sums[i][1] / counts[i], sums[i][2] / counts[i], 255];
                const movement = distSq(centroids[i], prevCentroids[i]);
                if (movement > maxMovement) maxMovement = movement;
            }
        }
        if (maxMovement < 0.01) break;
        prevCentroids = JSON.parse(JSON.stringify(centroids));
    }

    const output = new Uint8Array(rgba.length);
    for (let i = 0; i < rgba.length; i += 4) {
        if (rgba[i + 3] === 0) {
            output[i] = rgba[i]; output[i+1] = rgba[i+1]; output[i+2] = rgba[i+2]; output[i+3] = rgba[i+3];
            continue;
        }
        let minDist = Infinity;
        let bestC = [rgba[i], rgba[i+1], rgba[i+2]];
        for (const c of centroids) {
            const d = distSq([rgba[i], rgba[i+1], rgba[i+2]], c);
            if (d < minDist) {
                minDist = d;
                bestC = [Math.round(c[0]), Math.round(c[1]), Math.round(c[2])];
            }
        }
        output[i] = bestC[0]; output[i+1] = bestC[1]; output[i+2] = bestC[2]; output[i+3] = rgba[i+3];
    }
    return output;
}