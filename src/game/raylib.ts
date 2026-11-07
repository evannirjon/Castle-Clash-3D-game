// Raylib 2D Web Graphics & Sprite Pipeline (Texture2D, LoadTexture, DrawTexturePro, Flood-Fill Chroma-Keying)

export interface RLColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface RLVector2 {
  x: number;
  y: number;
}

export interface RLRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RLTexture2D {
  id: string;
  sourceUrl: string;
  width: number;
  height: number;
  ready: boolean;
  drawable: HTMLCanvasElement | HTMLImageElement | null;
}

export class Raylib2DContext {
  private ctx: CanvasRenderingContext2D;
  private textures = new Map<string, RLTexture2D>();

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  public LoadTexture(url: string, removeWhiteBackground = false): RLTexture2D {
    // Resolve relative to Vite base URL so it works seamlessly on GitHub Pages subdirectories
    const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || './';
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    const resolvedUrl = url.startsWith('http') || url.startsWith('data:') ? url : `${baseUrl}${cleanUrl}`;

    const cacheKey = `${resolvedUrl}::${removeWhiteBackground ? 'chroma' : 'raw'}`;
    const existing = this.textures.get(cacheKey);
    if (existing) return existing;

    const tex: RLTexture2D = {
      id: cacheKey,
      sourceUrl: resolvedUrl,
      width: 512,
      height: 512,
      ready: false,
      drawable: null,
    };
    this.textures.set(cacheKey, tex);

    if (typeof Image !== 'undefined') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        tex.width = img.naturalWidth || 512;
        tex.height = img.naturalHeight || 512;
        if (!removeWhiteBackground) {
          tex.drawable = img;
          tex.ready = true;
          return;
        }
        tex.drawable = this.stripOuterWhiteBackground(img);
        tex.ready = true;
      };
      img.onerror = () => {
        // Fallback: try relative path if absolute failed
        if (url.startsWith('/')) {
          img.src = '.' + url;
        }
      };
      img.src = resolvedUrl;
    }

    return tex;
  }

  // Border-seeded BFS Flood-Fill Chroma-Keying: removes only the exterior white background (#FFFFFF)
  // while preserving 100% of interior whites (shirts, eyes, armor highlights, teeth).
  private stripOuterWhiteBackground(img: HTMLImageElement): HTMLCanvasElement {
    const w = img.naturalWidth || 512;
    const h = img.naturalHeight || 512;
    const offscreen = document.createElement('canvas');
    offscreen.width = w;
    offscreen.height = h;
    const octx = offscreen.getContext('2d');
    if (!octx) return offscreen;

    octx.drawImage(img, 0, 0, w, h);
    const imgData = octx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const visited = new Uint8Array(w * h);
    const queue = new Int32Array(w * h);
    let head = 0;
    let tail = 0;

    const isOuterBgPixel = (idx4: number): boolean => {
      const r = data[idx4];
      const g = data[idx4 + 1];
      const b = data[idx4 + 2];
      // Near-white or light neutral background
      return r >= 228 && g >= 228 && b >= 226 && Math.abs(r - g) < 18 && Math.abs(g - b) < 18;
    };

    const pushSeed = (x: number, y: number) => {
      const i = y * w + x;
      if (visited[i]) return;
      if (isOuterBgPixel(i * 4)) {
        visited[i] = 1;
        queue[tail++] = i;
      }
    };

    // Seed all 4 borders
    for (let x = 0; x < w; x++) {
      pushSeed(x, 0);
      pushSeed(x, h - 1);
    }
    for (let y = 0; y < h; y++) {
      pushSeed(0, y);
      pushSeed(w - 1, y);
    }

    while (head < tail) {
      const curr = queue[head++];
      const cx = curr % w;
      const cy = (curr / w) | 0;
      const p4 = curr * 4;
      data[p4 + 3] = 0; // Transparent

      if (cx > 0) {
        const left = curr - 1;
        if (!visited[left] && isOuterBgPixel(left * 4)) {
          visited[left] = 1;
          queue[tail++] = left;
        }
      }
      if (cx < w - 1) {
        const right = curr + 1;
        if (!visited[right] && isOuterBgPixel(right * 4)) {
          visited[right] = 1;
          queue[tail++] = right;
        }
      }
      if (cy > 0) {
        const up = curr - w;
        if (!visited[up] && isOuterBgPixel(up * 4)) {
          visited[up] = 1;
          queue[tail++] = up;
        }
      }
      if (cy < h - 1) {
        const down = curr + w;
        if (!visited[down] && isOuterBgPixel(down * 4)) {
          visited[down] = 1;
          queue[tail++] = down;
        }
      }
    }

    // Soft 1px anti-aliased edge feathering along sprite silhouette
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        if (visited[i]) continue;
        const neighborsBg =
          visited[i - 1] + visited[i + 1] + visited[i - w] + visited[i + w];
        if (neighborsBg > 0) {
          const p4 = i * 4;
          const lum = (data[p4] + data[p4 + 1] + data[p4 + 2]) / 3;
          if (lum > 210) {
            data[p4 + 3] = Math.round(data[p4 + 3] * 0.35);
          } else if (lum > 180) {
            data[p4 + 3] = Math.round(data[p4 + 3] * 0.78);
          }
        }
      }
    }

    octx.putImageData(imgData, 0, 0);
    return offscreen;
  }

  // Raylib DrawTexturePro equivalent with horizontal flip support, origin pivot, rotation, and tint/flash
  public DrawTexturePro(
    texture: RLTexture2D,
    dest: RLRectangle,
    origin: RLVector2,
    rotationDeg: number,
    flipX = false,
    alpha = 1
  ): boolean {
    if (!texture.ready || !texture.drawable) return false;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(dest.x, dest.y);
    if (rotationDeg !== 0) {
      ctx.rotate((rotationDeg * Math.PI) / 180);
    }
    if (flipX) {
      ctx.scale(-1, 1);
    }
    ctx.drawImage(
      texture.drawable,
      -origin.x,
      -origin.y,
      dest.width,
      dest.height
    );
    ctx.restore();
    return true;
  }

  /**
   * Articulated Quadruped Gallop Renderer for Mounted Heroes, Cavalry & Boss Warlords.
   * Splits the sprite into:
   *  1. Far-side companion leg pair (oscillating in counter-phase for true 4-leg scissoring stride)
   *  2. Near-side articulated left & right leg pairs (swinging ±28° from hip/shoulder joints with knee lift)
   *  3. Upper horse torso, head & armored rider (rocking in natural gallop suspension pitch)
   */
  public DrawAnimatedCavalryPro(
    texture: RLTexture2D,
    dest: RLRectangle,
    origin: RLVector2,
    swingTiltDeg: number,
    flipX: boolean,
    walkPhase: number,
    isMoving: boolean,
    alpha = 1
  ): boolean {
    if (!texture.ready || !texture.drawable) return false;
    const ctx = this.ctx;
    const tw = texture.width;
    const th = texture.height;
    const dw = dest.width;
    const dh = dest.height;

    const strideAmp = isMoving ? 1.0 : 0.24;
    const gallopSin = Math.sin(walkPhase);
    const gallopCos = Math.cos(walkPhase);

    // Natural suspension bound & rocking pitch of a galloping warhorse
    const bodyLift = Math.abs(gallopSin) * 6.5 * strideAmp;
    const gallopPitchDeg = gallopCos * 4.5 * strideAmp + swingTiltDeg;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(dest.x, dest.y);
    if (flipX) {
      ctx.scale(-1, 1);
    }

    // Leg split geometry in texture & destination space (trim bottom 10.5% border of source sprite)
    const legTopRatio = 0.63;
    const legBottomRatio = 0.895;
    const legHeightRatio = legBottomRatio - legTopRatio;
    const srcLegY = th * legTopRatio;
    const srcLegH = th * legHeightRatio;
    const dstLegH = dh * (1.0 - legTopRatio);
    const hipPivotY = -dh * (1.0 - legTopRatio) - bodyLift * 0.45;

    // Helper to draw an articulated leg half (left half = hind/fore pair, right half = fore/hind pair)
    const drawLegSegment = (
      isRightHalf: boolean,
      swingRad: number,
      hoofLiftPx: number,
      strideShiftX: number,
      darkenPass: boolean
    ) => {
      const sx = isRightHalf ? tw * 0.48 : tw * 0.04;
      const sw = tw * 0.46;
      const dxOffset = isRightHalf ? -origin.x + dw * 0.48 : -origin.x + dw * 0.04;
      const segW = dw * 0.46;
      const pivotX = dxOffset + segW * 0.5 + strideShiftX;

      ctx.save();
      ctx.translate(pivotX, hipPivotY - hoofLiftPx);
      ctx.rotate(swingRad);
      if (darkenPass) {
        ctx.globalAlpha = alpha * 0.72;
      }
      ctx.drawImage(
        texture.drawable!,
        sx,
        srcLegY,
        sw,
        srcLegH,
        -segW * 0.5,
        -4,
        segW,
        dstLegH + 2
      );
      ctx.restore();
    };

    // 1. Far-side companion legs (counter-phase scissoring so all 4 horse legs visibly run!)
    const farAngleLeft = -gallopSin * 0.42 * strideAmp;
    const farAngleRight = Math.sin(walkPhase + 0.5) * 0.42 * strideAmp;
    const farLiftLeft = Math.max(0, -gallopCos) * 7.5 * strideAmp;
    const farLiftRight = Math.max(0, Math.cos(walkPhase + 0.5)) * 7.5 * strideAmp;

    drawLegSegment(false, farAngleLeft, farLiftLeft, -3 * strideAmp, true);
    drawLegSegment(true, farAngleRight, farLiftRight, 3 * strideAmp, true);

    // 2. Near-side primary legs (full rotary gallop extension & knee lift)
    const nearAngleLeft = gallopSin * 0.48 * strideAmp;
    const nearAngleRight = -Math.sin(walkPhase + 0.5) * 0.48 * strideAmp;
    const nearLiftLeft = Math.max(0, gallopCos) * 9.0 * strideAmp;
    const nearLiftRight = Math.max(0, -Math.cos(walkPhase + 0.5)) * 9.0 * strideAmp;

    drawLegSegment(false, nearAngleLeft, nearLiftLeft, gallopSin * 5.5 * strideAmp, false);
    drawLegSegment(true, nearAngleRight, nearLiftRight, -gallopSin * 5.5 * strideAmp, false);

    // 3. Upper Horse Torso, Head, Cape & Rider (0%..67% of texture height so hip seam is 100% covered)
    const upperRatio = 0.67;
    ctx.save();
    ctx.translate(0, -bodyLift);
    ctx.rotate((gallopPitchDeg * Math.PI) / 180);
    ctx.drawImage(
      texture.drawable,
      0,
      0,
      tw,
      th * upperRatio,
      -origin.x,
      -origin.y,
      dw,
      dh * upperRatio
    );
    ctx.restore();

    ctx.restore();
    return true;
  }

  /**
   * Articulated Winged Dragon Renderer.
   * Isolates the Dragon's Wing Canopy (0%..70% X, 0%..55% Y) from its Head/Neck/Chest/Tail so
   * the wings beat through a full upstroke/downstroke arc while the Dragon's head stays single & crisp!
   */
  public DrawAnimatedDragonPro(
    texture: RLTexture2D,
    dest: RLRectangle,
    origin: RLVector2,
    baseTiltDeg: number,
    flipX: boolean,
    wingPhase: number,
    alpha = 1
  ): boolean {
    if (!texture.ready || !texture.drawable) return false;
    const ctx = this.ctx;
    const tw = texture.width;
    const th = texture.height;
    const dw = dest.width;
    const dh = dest.height;

    const flapSin = Math.sin(wingPhase);
    const flapCos = Math.cos(wingPhase);

    // Body counter-surges upward on each wing downstroke
    const bodySurgeY = -flapSin * 9.5;
    const bodyPitchDeg = baseTiltDeg + flapCos * 5.0;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(dest.x, dest.y + bodySurgeY);
    if (flipX) {
      ctx.scale(-1, 1);
    }
    ctx.rotate((bodyPitchDeg * Math.PI) / 180);

    const shoulderX = -origin.x + dw * 0.42;
    const shoulderY = -origin.y + dh * 0.46;
    const wingW = dw * 0.72;
    const wingH = dh * 0.52;

    // 1. Far-side / secondary wing beat (0%..72% X, 0%..52% Y — excludes head so head never duplicates!)
    const backFlapScaleY = 0.35 + 0.72 * (0.5 + 0.5 * Math.sin(wingPhase + 0.85));
    const backFlapRot = Math.cos(wingPhase + 0.85) * 0.24;
    ctx.save();
    ctx.globalAlpha = alpha * 0.76;
    ctx.translate(shoulderX - 10, shoulderY);
    ctx.rotate(backFlapRot);
    ctx.scale(0.95, backFlapScaleY);
    ctx.drawImage(
      texture.drawable,
      0,
      0,
      tw * 0.72,
      th * 0.52,
      -wingW * 0.58,
      -wingH * 0.88,
      wingW,
      wingH
    );
    ctx.restore();

    // 2. Whipping Serpent Tail & Hind Talons (66%..100% Y)
    const tailRot = Math.sin(wingPhase - 1.1) * 0.2;
    const tailPivotY = -origin.y + dh * 0.68;
    ctx.save();
    ctx.translate(0, tailPivotY);
    ctx.rotate(tailRot);
    ctx.drawImage(
      texture.drawable,
      0,
      th * 0.66,
      tw,
      th * 0.34,
      -origin.x,
      -dh * 0.02,
      dw,
      dh * 0.34
    );
    ctx.restore();

    // 3. Dragon Armored Chest, Neck & Lower Body Core (38%..74% Y)
    ctx.drawImage(
      texture.drawable,
      0,
      th * 0.38,
      tw,
      th * 0.36,
      -origin.x,
      -origin.y + dh * 0.38,
      dw,
      dh * 0.36
    );

    // 4. Dragon Head & Upper Jaws (62%..100% X, 8%..48% Y — drawn once so head is crisp and fierce!)
    ctx.drawImage(
      texture.drawable,
      tw * 0.62,
      th * 0.08,
      tw * 0.38,
      th * 0.4,
      -origin.x + dw * 0.62,
      -origin.y + dh * 0.08,
      dw * 0.38,
      dh * 0.4
    );

    // 5. Primary Foreground Wing Canopy (0%..72% X, 0%..52% Y) — Full articulated upstroke & downstroke!
    const frontWingScaleY = 0.22 + 0.94 * (0.5 + 0.5 * flapSin);
    const frontWingRot = flapCos * 0.32;
    ctx.save();
    ctx.translate(shoulderX, shoulderY);
    ctx.rotate(frontWingRot);
    ctx.scale(1.0 + (1.0 - frontWingScaleY) * 0.14, frontWingScaleY);
    ctx.drawImage(
      texture.drawable,
      0,
      0,
      tw * 0.72,
      th * 0.52,
      -wingW * 0.58,
      -wingH * 0.88,
      wingW,
      wingH
    );
    ctx.restore();

    ctx.restore();
    return true;
  }
}
