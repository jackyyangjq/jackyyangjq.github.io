// Equal Earth projection (Šavrič, Patterson & Jenny 2018), matching d3-geo's geoEqualEarth,
// so a latitude/longitude can be placed on the pre-built world map.
const A1 = 1.340264;
const A2 = -0.081106;
const A3 = 0.000893;
const A4 = 0.003796;
const M = Math.sqrt(3) / 2;

export interface ProjectionParams {
    scale: number;
    translate: [number, number];
}

export function projectEqualEarth(lon: number, lat: number, { scale, translate }: ProjectionParams): [number, number] {
    const lambda = (lon * Math.PI) / 180;
    const phi = (lat * Math.PI) / 180;
    const l = Math.asin(M * Math.sin(phi));
    const l2 = l * l;
    const l6 = l2 * l2 * l2;
    const x = (lambda * Math.cos(l)) / (M * (A1 + 3 * A2 * l2 + l6 * (7 * A3 + 9 * A4 * l2)));
    const y = l * (A1 + A2 * l2 + l6 * (A3 + A4 * l2));
    return [translate[0] + scale * x, translate[1] - scale * y];
}
