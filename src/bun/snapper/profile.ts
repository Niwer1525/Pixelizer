import { type SnapperConfig, type Profiles } from '../../shared/objects';

export function computeProfiles(width: number, height: number, rgba: Uint8Array): Profiles {
    const colProj = new Array<number>(width).fill(0);
    const rowProj = new Array<number>(height).fill(0);

    const getGray = (x: number, y: number): number => {
        const idx = (y * width + x) * 4;
        if (rgba[idx + 3] === 0) return 0.0;
        return 0.299 * rgba[idx] + 0.587 * rgba[idx + 1] + 0.114 * rgba[idx + 2];
    };

    for (let y = 0; y < height; y++) {
        for (let x = 1; x < width - 1; x++) colProj[x] += Math.abs(getGray(x + 1, y) - getGray(x - 1, y));
    }
    for (let x = 0; x < width; x++) {
        for (let y = 1; y < height - 1; y++) rowProj[y] += Math.abs(getGray(x, y + 1) - getGray(x, y - 1));
    }
    return { colProj, rowProj };
}

export function estimateStepSize(profile: number[], config: SnapperConfig): number | null {
    if (profile.length === 0) return null;
    const maxVal = Math.max(...profile);
    if (maxVal === 0) return null;

    const threshold = maxVal * config.peakThresholdMultiplier;
    const peaks: number[] = [];
    for (let i = 1; i < profile.length - 1; i++) {
        if (profile[i] > threshold && profile[i] > profile[i - 1] && profile[i] > profile[i + 1]) peaks.push(i);
    }
    if (peaks.length < 2) return null;

    const cleanPeaks = [peaks[0]];
    for (let i = 1; i < peaks.length; i++) {
        if (peaks[i] - cleanPeaks[cleanPeaks.length - 1] > (config.peakDistanceFilter - 1)) cleanPeaks.push(peaks[i]);
    }
    if (cleanPeaks.length < 2) return null;

    const diffs: number[] = [];
    for (let i = 1; i < cleanPeaks.length; i++) diffs.push(cleanPeaks[i] - cleanPeaks[i - 1]);
    diffs.sort((a, b) => a - b);
    return diffs[Math.floor(diffs.length / 2)];
}

export function resolveStepSizes(stepX: number | null, stepY: number | null, width: number, height: number, config: SnapperConfig): [number, number] {
    if (config.pixelSizeOverride) return [config.pixelSizeOverride, config.pixelSizeOverride];
    if (stepX !== null && stepY !== null) {
        const ratio = stepX > stepY ? stepX / stepY : stepY / stepX;
        if (ratio > config.maxStepRatio) {
            const smaller = Math.min(stepX, stepY);
            return [smaller, smaller];
        }
        const avg = (stepX + stepY) / 2;
        return [avg, avg];
    }
    if (stepX !== null) return [stepX, stepX];
    if (stepY !== null) return [stepY, stepY];
    
    const fallback = Math.max(Math.min(width, height) / config.fallbackTargetSegments, 1.0);
    return [fallback, fallback];
}

export function walk(profile: number[], stepSize: number, limit: number, config: SnapperConfig): number[] {
    const cuts = [0];
    let currentPos = 0.0;
    const searchWindow = Math.max(stepSize * config.walkerSearchWindowRatio, config.walkerMinSearchWindow);
    const meanVal = profile.reduce((a, b) => a + b, 0) / profile.length;

    while (currentPos < limit) {
        const target = currentPos + stepSize;
        if (target >= limit) {
            cuts.push(limit);
            break;
        }

        const startSearch = Math.max(Math.floor(target - searchWindow), Math.floor(currentPos + 1));
        const endSearch = Math.min(Math.floor(target + searchWindow), limit);

        if (endSearch <= startSearch) {
            currentPos = target;
            continue;
        }

        let maxVal = -1;
        let maxIdx = startSearch;
        for (let i = startSearch; i < endSearch; i++) {
            if (profile[i] > maxVal) { maxVal = profile[i]; maxIdx = i; }
        }

        if (maxVal > meanVal * config.walkerStrengthThreshold) {
            cuts.push(maxIdx);
            currentPos = maxIdx;
        } else {
            cuts.push(Math.floor(target));
            currentPos = target;
        }
    }
    return cuts;
}

export function stabilizeBothAxes(profileX: number[], profileY: number[], rawCol: number[], rawRow: number[], width: number, height: number, config: SnapperConfig): [number[], number[]] {
    const colPass1 = stabilizeCuts(profileX, rawCol, width, rawRow, height, config);
    const rowPass1 = stabilizeCuts(profileY, rawRow, height, rawCol, width, config);

    const colCells = Math.max(colPass1.length - 1, 1);
    const rowCells = Math.max(rowPass1.length - 1, 1);
    const colStep = width / colCells;
    const rowStep = height / rowCells;
    const ratio = colStep > rowStep ? colStep / rowStep : rowStep / colStep;

    if (ratio > config.maxStepRatio) {
        const targetStep = Math.min(colStep, rowStep);
        const finalCol = colStep > targetStep * 1.2 ? snapUniformCuts(profileX, width, targetStep, config) : colPass1;
        const finalRow = rowStep > targetStep * 1.2 ? snapUniformCuts(profileY, height, targetStep, config) : rowPass1;
        return [finalCol, finalRow];
    }
    return [colPass1, rowPass1];
}

function stabilizeCuts(profile: number[], cuts: number[], limit: number, siblingCuts: number[], siblingLimit: number, config: SnapperConfig): number[] {
    if (limit === 0) return [0];
    const sanitized = sanitizeCuts(cuts, limit);
    const minReq = Math.min(Math.max(config.minCutsPerAxis, 2), limit + 1);
    const axisCells = sanitized.length - 1;
    const siblingCells = siblingCuts.length - 1;

    const siblingHasGrid = siblingLimit > 0 && siblingCells >= (minReq - 1) && siblingCells > 0;
    const stepsSkewed = siblingHasGrid && axisCells > 0 && (() => {
        const axisStep = limit / axisCells;
        const siblingStep = siblingLimit / siblingCells;
        const ratio = axisStep / siblingStep;
        return ratio > config.maxStepRatio || ratio < (1.0 / config.maxStepRatio);
    })();

    if (sanitized.length >= minReq && !stepsSkewed) return sanitized;

    let targetStep = siblingHasGrid ? (siblingLimit / siblingCells) : (limit / config.fallbackTargetSegments);
    if (!Number.isFinite(targetStep) || targetStep <= 0) targetStep = 1.0;

    return snapUniformCuts(profile, limit, targetStep, config);
}

function sanitizeCuts(cuts: number[], limit: number): number[] {
    if (limit === 0) return [0];
    let unique = [...new Set(cuts.map(v => v >= limit ? limit : Math.max(0, v)))];
    if (!unique.includes(0)) unique.push(0);
    if (!unique.includes(limit)) unique.push(limit);
    return unique.sort((a, b) => a - b);
}

function snapUniformCuts(profile: number[], limit: number, targetStep: number, config: SnapperConfig): number[] {
    if (limit === 0) return [0];
    if (limit === 1) return [0, 1];

    let desiredCells = Math.min(Math.max(Math.round(limit / targetStep), config.minCutsPerAxis - 1, 1), limit);
    const cellWidth = limit / desiredCells;
    const searchWindow = Math.max(cellWidth * config.walkerSearchWindowRatio, config.walkerMinSearchWindow);
    const meanVal = profile.reduce((a, b) => a + b, 0) / (profile.length || 1);

    const cuts = [0];
    for (let idx = 1; idx < desiredCells; idx++) {
        const target = cellWidth * idx;
        const prev = cuts[cuts.length - 1];
        if (prev + 1 >= limit) break;

        let start = Math.max(Math.floor(target - searchWindow), prev + 1);
        let end = Math.min(Math.ceil(target + searchWindow), limit - 1);
        if (end < start) { start = prev + 1; end = start; }

        let bestIdx = start;
        let bestVal = -1;
        for (let i = start; i <= end; i++) {
            const v = profile[i] || 0;
            if (v > bestVal) { bestVal = v; bestIdx = i; }
        }

        if (bestVal < meanVal * config.walkerStrengthThreshold) {
            let fallbackIdx = Math.round(target);
            if (fallbackIdx <= prev) fallbackIdx = prev + 1;
            if (fallbackIdx >= limit) fallbackIdx = limit - 1;
            bestIdx = fallbackIdx;
        }
        cuts.push(bestIdx);
    }
    if (cuts[cuts.length - 1] !== limit) cuts.push(limit);
    return sanitizeCuts(cuts, limit);
}