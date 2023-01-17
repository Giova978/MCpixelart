// the following functions are based off of the pseudocode
// found on www.easyrgb.com

export function lab2rgb(lab: number[]) {
    var y = (lab[0] + 16) / 116,
        x = lab[1] / 500 + y,
        z = y - lab[2] / 200,
        r,
        g,
        b;

    x = 0.95047 * (x * x * x > 0.008856 ? x * x * x : (x - 16 / 116) / 7.787);
    y = 1.0 * (y * y * y > 0.008856 ? y * y * y : (y - 16 / 116) / 7.787);
    z = 1.08883 * (z * z * z > 0.008856 ? z * z * z : (z - 16 / 116) / 7.787);

    r = x * 3.2406 + y * -1.5372 + z * -0.4986;
    g = x * -0.9689 + y * 1.8758 + z * 0.0415;
    b = x * 0.0557 + y * -0.204 + z * 1.057;

    r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
    g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
    b = b > 0.0031308 ? 1.055 * Math.pow(b, 1 / 2.4) - 0.055 : 12.92 * b;

    return [Math.max(0, Math.min(1, r)) * 255, Math.max(0, Math.min(1, g)) * 255, Math.max(0, Math.min(1, b)) * 255];
}

export function rgb2lab(rgb: number[]) {
    let r = rgb[0] / 255;
    let g = rgb[1] / 255;
    let b = rgb[2] / 255;
    let x, y, z;

    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

    x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
    y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.0;
    z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

    x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
    y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
    z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;

    return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

export function deltaE(labA: number[], labB: number[]) {
    // http://www.brucelindbloom.com/index.html?Eqn_DeltaE_CIE94.html
    const sqrt = Math.sqrt;
    const pow = Math.pow;

    const deltaL = labA[0] - labB[0];
    const deltaA = labA[1] - labB[1];
    const deltaB = labA[2] - labB[2];

    const getC = (a: number, b: number) => sqrt(pow(a, 2) + pow(b, 2));
    const C1 = getC(labA[1], labA[2]);
    const C2 = getC(labB[1], labB[2]);

    const deltaC = C1 - C2;

    const deltaH = sqrt(pow(deltaA, 2) + pow(deltaB, 2) - pow(deltaC, 2));

    const Sl = 1;
    const Sc = 1 + 0.045 * C1;
    const Sh = 1 + 0.015 * C1;

    const firstTerm = pow(deltaL / Sl, 2);
    const secondTerm = pow(deltaC / Sc, 2);
    const thirdTerm = pow(deltaH / Sh, 2);

    const delta = sqrt(firstTerm + secondTerm + thirdTerm);

    return delta;
}
