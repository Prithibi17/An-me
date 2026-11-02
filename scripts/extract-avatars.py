#!/usr/bin/env python3
"""
Reusable Anime Profile Avatar Extractor.
Extracts circular avatars from grid images (5 columns x 3 rows),
detects exact circle bounds, applies an antialiased circular alpha mask
to eliminate black background, and exports optimized WebP avatars.
"""

import os
import sys
import argparse
import numpy as np
from PIL import Image, ImageDraw

DEFAULT_IMG1 = r"C:/Users/HERMIT-PRITHIBI/.gemini/antigravity/brain/af78f65b-8c79-44df-86ec-8915e0b0308d/.user_uploaded/media_1793637923672_2b6f30c9.jpg"
DEFAULT_IMG2 = r"C:/Users/HERMIT-PRITHIBI/.gemini/antigravity/brain/af78f65b-8c79-44df-86ec-8915e0b0308d/.user_uploaded/media_1793638112856_eb90a035.jpg"
DEFAULT_OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "avatars")

def detect_avatars_in_image(img_path, num_rows=3, num_cols=5, threshold=22):
    """
    Detects the 15 circular avatar boundaries in a 5-column x 3-row grid image
    by segmenting non-black avatar regions across each row band.
    Returns list of 15 dicts sorted by row then column:
      [{ 'cx': int, 'cy': int, 'r': int }, ...]
    """
    img = Image.open(img_path)
    w_img, h_img = img.size
    arr = np.array(img).astype(float)
    non_black = arr.max(axis=2) > threshold
    
    # Divide image into horizontal row bands
    band_height = h_img / num_rows
    circles = []
    
    for r in range(num_rows):
        y_start = int(r * band_height)
        y_end = int((r + 1) * band_height)
        row_mask = non_black[y_start:y_end, :]
        
        # Horizontal projection in this row band
        proj_x = row_mask.sum(axis=0)
        
        # Identify non-black column clusters
        in_col = False
        cols = []
        for x in range(len(proj_x)):
            if proj_x[x] > 15 and not in_col:
                start_x = x
                in_col = True
            elif proj_x[x] <= 15 and in_col:
                cols.append((start_x, x - 1))
                in_col = False
        if in_col:
            cols.append((start_x, len(proj_x) - 1))
            
        # Filter noise and keep the 5 main circle columns
        cols = [c for c in cols if (c[1] - c[0]) > 80]
        cols.sort(key=lambda c: c[0])
        
        if len(cols) != num_cols:
            raise ValueError(f"Expected {num_cols} avatar columns in row {r}, found {len(cols)}")
            
        for c_idx, (x_s, x_e) in enumerate(cols):
            col_mask = row_mask[:, x_s:x_e+1]
            ys = np.where(col_mask.sum(axis=1) > 0)[0]
            if len(ys) == 0:
                continue
            y_min = y_start + ys[0]
            y_max = y_start + ys[-1]
            
            cx = int(round((x_s + x_e) / 2.0))
            cy = int(round((y_min + y_max) / 2.0))
            w = x_e - x_s + 1
            h = y_max - y_min + 1
            # Radius preserving full outer circle border
            r_circle = int(round(max(w, h) / 2.0))
            
            circles.append({
                'row': r,
                'col': c_idx,
                'cx': cx,
                'cy': cy,
                'r': r_circle,
                'w': w,
                'h': h,
            })
            
    # Sort strictly by row, then col
    circles.sort(key=lambda c: (c['row'], c['col']))
    return circles

def crop_and_apply_circular_mask(img, cx, cy, r, target_size=256):
    """
    Crops square box centered on (cx, cy) with radius r (+1px margin),
    applies a smooth 4x supersampled antialiased circular alpha mask,
    and returns a clean, square RGBA image.
    """
    crop_size = 2 * r + 2
    x1 = cx - r - 1
    y1 = cy - r - 1
    x2 = x1 + crop_size
    y2 = y1 + crop_size
    
    # Crop source
    cropped = img.crop((x1, y1, x2, y2)).convert('RGBA')
    
    # 4x supersampled smooth antialiased circular alpha mask
    scale = 4
    mask_hires = Image.new('L', (crop_size * scale, crop_size * scale), 0)
    draw = ImageDraw.Draw(mask_hires)
    draw.ellipse((scale, scale, (crop_size - 1) * scale, (crop_size - 1) * scale), fill=255)
    mask = mask_hires.resize((crop_size, crop_size), Image.Resampling.LANCZOS)
    
    cropped.putalpha(mask)
    
    if crop_size != target_size:
        return cropped.resize((target_size, target_size), Image.Resampling.LANCZOS)
    return cropped

def extract_all(img1_path, img2_path, out_dir, target_size=256, quality=95):
    os.makedirs(out_dir, exist_ok=True)
    
    sources = [(img1_path, 1), (img2_path, 16)]
    exported_files = []
    
    for path, start_idx in sources:
        if not os.path.exists(path):
            raise FileNotFoundError(f"Input image not found: {path}")
            
        basename = os.path.basename(path)
        print(f"[*] Processing {basename} (Avatars {start_idx:02d} - {start_idx + 14:02d})...")
        img = Image.open(path)
        circles = detect_avatars_in_image(path, num_rows=3, num_cols=5)
        
        if len(circles) != 15:
            raise ValueError(f"Expected 15 circles, detected {len(circles)} in {path}")
            
        for i, c in enumerate(circles):
            avatar_num = start_idx + i
            avatar_img = crop_and_apply_circular_mask(img, c['cx'], c['cy'], c['r'], target_size)
            filename = f"avatar-{avatar_num:02d}.webp"
            out_path = os.path.join(out_dir, filename)
            avatar_img.save(out_path, "WEBP", quality=quality)
            exported_files.append(out_path)
            print(f"  [+] Saved {filename} [cx={c['cx']}, cy={c['cy']}, r={c['r']}]")
            
    print(f"\n[OK] Successfully extracted and exported {len(exported_files)} avatars to {out_dir}")
    
    # Validation
    print("[*] Validating output avatars...")
    assert len(exported_files) == 30, f"Expected 30 files, got {len(exported_files)}"
    for f in exported_files:
        assert os.path.exists(f), f"Missing file: {f}"
        test_im = Image.open(f)
        assert test_im.size == (target_size, target_size), f"Invalid size in {f}: {test_im.size}"
        assert test_im.mode == "RGBA", f"Invalid mode in {f}: {test_im.mode}"
        # Validate 4 corners are 100% transparent
        for pt in [(0, 0), (target_size - 1, 0), (0, target_size - 1), (target_size - 1, target_size - 1)]:
            px = test_im.getpixel(pt)
            assert px[3] == 0, f"Corner {pt} not transparent in {f}: {px}"
        # Validate center is opaque
        center_px = test_im.getpixel((target_size // 2, target_size // 2))
        assert center_px[3] > 0, f"Center not opaque in {f}"
        
    print("[OK] All 30 avatars validated successfully (dimensions, transparency, centering)!\n")
    return exported_files

def main():
    parser = argparse.ArgumentParser(description="Extract 30 anime profile avatars from reference grid images.")
    parser.add_argument("--image1", default=DEFAULT_IMG1, help="Path to first 15-avatar grid image")
    parser.add_argument("--image2", default=DEFAULT_IMG2, help="Path to second 15-avatar grid image")
    parser.add_argument("--out-dir", default=DEFAULT_OUT, help="Output directory for webp avatars")
    parser.add_argument("--size", type=int, default=256, help="Target avatar square resolution (default: 256)")
    parser.add_argument("--quality", type=int, default=95, help="WebP compression quality (default: 95)")
    args = parser.parse_args()
    
    extract_all(args.image1, args.image2, args.out_dir, args.size, args.quality)

if __name__ == "__main__":
    main()
