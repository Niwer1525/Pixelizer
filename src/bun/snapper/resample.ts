import { PNG } from 'pngjs';

export function resample(imgWidth: number, imgHeight: number, rgba: Uint8Array, cols: number[], rows: number[]): PNG {
    const outW = Math.max(cols.length - 1, 1);
    const outH = Math.max(rows.length - 1, 1);

    const outPng = new PNG({ width: outW, height: outH });

    for (let yI = 0; yI < rows.length - 1; yI++) {
        for (let xI = 0; xI < cols.length - 1; xI++) {
            const ys = rows[yI], ye = rows[yI + 1];
            const xs = cols[xI], xe = cols[xI + 1];

            if (xe <= xs || ye <= ys) continue;

            const counts = new Map<string, number>();
            for (let y = ys; y < ye; y++) {
                for (let x = xs; x < xe; x++) {
                    if (x < imgWidth && y < imgHeight) {
                        const idx = (y * imgWidth + x) * 4;
                        const key = `${rgba[idx]},${rgba[idx+1]},${rgba[idx+2]},${rgba[idx+3]}`;
                        counts.set(key, (counts.get(key) || 0) + 1);
                    }
                }
            }

            let maxCount = -1;
            let bestPixel = [0, 0, 0, 0];
            for (const [key, count] of counts.entries()) {
                if (count > maxCount) {
                    maxCount = count;
                    bestPixel = key.split(',').map(Number);
                }
            }

            const outIdx = (yI * outW + xI) * 4;
            outPng.data[outIdx] = bestPixel[0];
            outPng.data[outIdx + 1] = bestPixel[1];
            outPng.data[outIdx + 2] = bestPixel[2];
            outPng.data[outIdx + 3] = bestPixel[3];
        }
    }
    return outPng;
}