import fs from 'fs';

const N = 17; // 17-point cube is ~130KB, standard, fast and ultra-compact
let out = 'TITLE "Voxel Island Golden Hour Grade"\nLUT_3D_SIZE ' + N + '\n';

for (let b = 0; b < N; b++) {
  for (let g = 0; g < N; g++) {
    for (let r = 0; r < N; r++) {
      let red = r / (N - 1);
      let green = g / (N - 1);
      let blue = b / (N - 1);

      // Gentle S-curve
      red = red * red * (3 - 2 * red);
      green = green * green * (3 - 2 * green);
      blue = blue * blue * (3 - 2 * blue);

      // Warm highlights (slight red/yellow lift), teal shadows (slight blue/green floor)
      red = Math.min(1.0, red * 1.05 + 0.01);
      green = Math.min(1.0, green * 1.02 + 0.015);
      blue = Math.max(0.0, blue * 0.96 + 0.02);

      out += red.toFixed(6) + ' ' + green.toFixed(6) + ' ' + blue.toFixed(6) + '\n';
    }
  }
}

fs.writeFileSync('public/grade.cube', out);
console.log('grade.cube generated, size bytes:', out.length);

