/**
 * Helper to generate Code 128 (subset B) barcode as an SVG string or React Component.
 * Code 128 B is suitable for standard alphanumeric ASCII strings.
 */

// Code 128 patterns for indices 0 to 106
// Each code represents the widths of 3 bars and 3 spaces (total 11 modules), except stop (13 modules)
const CODE128_PATTERNS = [
  "11011001100", "11001101100", "11001100110", "10010011000", "10010001100", // 0-4
  "10001001100", "10011001000", "10011000100", "10001100100", "11001001000", // 5-9
  "11001000100", "11000100100", "10110011100", "10011011100", "10011001110", // 10-14
  "10111001100", "10011101100", "10011100110", "11001110010", "11001011100", // 15-19
  "11001001110", "11011100100", "11001110100", "11101101110", "11101001100", // 20-24
  "11101000110", "11100010110", "11101100100", "11100110100", "11100110010", // 25-29
  "11011011000", "11011000110", "11000110110", "10100011000", "10001011000", // 30-34
  "10001000110", "10110001100", "10001101100", "10001100110", "11000110100", // 35-39
  "11000110010", "11011011100", "11001101110", "11001100111", "11000111010", // 40-44
  "11000110001", "11011101000", "11011100010", "11011101110", "11101011000", // 45-49
  "11101000101", "11100010101", "11100010001", "11101011100", "11101001110", // 50-54
  "11100010111", "11101110100", "11101110010", "11101110001", "11010111000", // 55-59
  "11010001110", "11000101110", "11011101011", "11101011110", "11110101100", // 60-64
  "11110100110", "11110001010", "11110001001", "11011011110", "11011110110", // 65-69
  "11011110011", "11101011110", "11101110110", "11101110011", "11110110110", // 70-74
  "11110110011", "11110011011", "11110011001", "11001111010", "11001111001", // 75-79
  "11011111010", "11001111101", "11110111010", "11110111001", "11110011110", // 80-84
  "11110011101", "11111011010", "11111011001", "11111011110", "11111011101", // 85-89
  "11111001111", "11000011001", "11001100001", "11001101111", "11001111011", // 90-94
  "11001111101", "11000010111", "11000010001", "11000010001", "10111110110", // 95-99 (98,99 are code C/code B shifts)
  "10111110011", "11101011110", "11110101110", "11000010100", "11000010100", // 100-104
  "11000010100", "11011101100" // 105-106 (104 is Start A, 105 is Start B, 106 is Start C)
];

const CODE128_STOP = "1100011101011"; // Standard stop pattern is 13 bits

// Start B value (Standard Code 128B start)
const START_B_INDEX = 104;

/**
 * Encodes a string to Code 128B binary sequence (string of '1' and '0')
 */
export function encodeCode128B(value: string): string {
  const indices: number[] = [];
  
  // Add Start B
  indices.push(START_B_INDEX);
  
  let sum = START_B_INDEX;
  
  for (let i = 0; i < value.length; i++) {
    const charCode = value.charCodeAt(i);
    let index = 0;
    
    if (charCode >= 32 && charCode <= 126) {
      index = charCode - 32;
    } else {
      // Fallback for non-ASCII to space
      index = 0;
    }
    
    indices.push(index);
    sum += index * (i + 1);
  }
  
  // Calculate checksum
  const checksum = sum % 103;
  indices.push(checksum);
  
  // Map to binary pattern
  let binary = "";
  for (const idx of indices) {
    binary += CODE128_PATTERNS[idx];
  }
  
  // Add Stop pattern
  binary += CODE128_STOP;
  
  return binary;
}

/**
 * Generates an SVG string representation of a Code 128B barcode
 */
export function generateBarcodeSvg(
  value: string,
  width: number = 180,
  height: number = 60,
  showText: boolean = true
): string {
  try {
    const binary = encodeCode128B(value);
    const numModules = binary.length;
    const quietZone = 10;
    const barWidth = (width - quietZone * 2) / numModules;
    
    let rectsHtml = "";
    let isBar = false;
    let runLength = 0;
    let xPos = quietZone;
    
    for (let i = 0; i < binary.length; i++) {
      const bit = binary[i] === "1";
      if (i === 0) {
        isBar = bit;
        runLength = 1;
      } else if (bit === isBar) {
        runLength++;
      } else {
        if (isBar) {
          rectsHtml += `<rect x="${xPos.toFixed(2)}" y="5" width="${(runLength * barWidth).toFixed(2)}" height="${(height - (showText ? 20 : 10)).toFixed(2)}" fill="black" />`;
        }
        xPos += runLength * barWidth;
        isBar = bit;
        runLength = 1;
      }
    }
    
    if (isBar) {
      rectsHtml += `<rect x="${xPos.toFixed(2)}" y="5" width="${(runLength * barWidth).toFixed(2)}" height="${(height - (showText ? 20 : 10)).toFixed(2)}" fill="black" />`;
    }
    
    let textHtml = "";
    if (showText) {
      textHtml = `<text x="${(width / 2).toFixed(2)}" y="${(height - 2).toFixed(2)}" font-family="monospace" font-size="11" text-anchor="middle" fill="black">${value}</text>`;
    }
    
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="white" />
      ${rectsHtml}
      ${textHtml}
    </svg>`;
  } catch (err) {
    console.error("Barcode generation error:", err);
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#fee2e2" />
      <text x="${(width/2).toFixed(2)}" y="${(height/2 + 4).toFixed(2)}" font-family="sans-serif" font-size="10" text-anchor="middle" fill="#ef4444">Barcode Error</text>
    </svg>`;
  }
}
