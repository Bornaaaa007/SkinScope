"""
features.py
─────────────────────────────────────────────────────────
STEP 1 of the ML pipeline: turn a face photo into NUMBERS.

Machine learning models can't look at pixels directly and understand
"acne" or "dryness" — they need a fixed-length list of numbers
(a "feature vector") that describes the image. This file computes
those numbers using classic computer vision (OpenCV), and the model
in model.py learns the relationship between these numbers and skin
concerns.

Every function below returns a plain float, roughly normalized to
0-1 (or 0-100), so the ML model receives comparable, easy-to-learn
values instead of raw pixel data.
"""

import cv2
import numpy as np


IMG_SIZE = 256  # every photo is resized to 256x256 so features are comparable


def load_image(path_or_bytes):
    """Load an image from a file path OR raw bytes (as sent by the browser)."""
    if isinstance(path_or_bytes, (bytes, bytearray)):
        arr = np.frombuffer(path_or_bytes, np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    else:
        img = cv2.imread(str(path_or_bytes))
    if img is None:
        raise ValueError("Could not read image — file may be corrupted or not an image.")
    img = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
    return img  # BGR, uint8, shape (256, 256, 3)


def _skin_mask(img_bgr):
    """
    Roughly isolate skin-colored pixels so background/hair/eyes don't
    pollute the measurements below. Uses the classic YCrCb skin-color range.
    """
    ycrcb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2YCrCb)
    lower = np.array([0, 133, 77], dtype=np.uint8)
    upper = np.array([255, 173, 127], dtype=np.uint8)
    mask = cv2.inRange(ycrcb, lower, upper)
    # Clean up small noise in the mask
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    if mask.sum() == 0:
        # fallback: use the whole image if skin detection fails (e.g. b/w photo)
        mask[:] = 255
    return mask


def redness_score(img_bgr, mask):
    """
    Average how much more 'red' skin pixels are compared to green/blue.
    High values → visible redness / irritation / active breakouts.
    """
    b, g, r = cv2.split(img_bgr.astype(np.float32))
    idx = mask > 0
    red_excess = (r[idx] - (g[idx] + b[idx]) / 2).mean()
    return float(np.clip(red_excess / 40.0, 0, 1))  # normalize to ~0-1


def oiliness_score(img_bgr, mask):
    """
    Detect shiny/specular highlights (very bright + low saturation spots),
    which correlate with oily skin. Returns the % of skin area that's shiny.
    """
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    h, s, v = cv2.split(hsv)
    shine = (v > 200) & (s < 60) & (mask > 0)
    skin_pixels = max((mask > 0).sum(), 1)
    return float(shine.sum() / skin_pixels)


def texture_roughness(img_bgr, mask):
    """
    High-frequency detail (Laplacian variance) inside the skin area.
    High values → uneven texture / bumpy skin.
    """
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    lap = cv2.Laplacian(gray, cv2.CV_64F)
    idx = mask > 0
    variance = lap[idx].var() if idx.sum() > 0 else 0
    return float(np.clip(variance / 500.0, 0, 1))


def dark_spot_count(img_bgr, mask):
    """
    Count small dark blobs on the skin (relative to local brightness) —
    a proxy for dark spots / hyperpigmentation / acne marks.
    """
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (25, 25), 0)
    diff = cv2.subtract(blurred, gray)  # pixels darker than their surroundings
    diff[mask == 0] = 0
    _, thresh = cv2.threshold(diff, 15, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    spots = [c for c in contours if 3 < cv2.contourArea(c) < 200]
    return float(np.clip(len(spots) / 60.0, 0, 1))  # normalize to ~0-1


def wrinkle_score(img_bgr, mask):
    """
    Edge density on the skin — fine lines/wrinkles show up as many
    thin edges. Normalized so a smooth face scores near 0.
    """
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 40, 120)
    edges[mask == 0] = 0
    skin_pixels = max((mask > 0).sum(), 1)
    return float(np.clip((edges > 0).sum() / skin_pixels / 0.08, 0, 1))


def dryness_score(oiliness, texture, redness):
    """
    Dryness isn't directly visible the way oil/redness are — it's
    inferred: rough texture + low shine + some redness (flaking/irritation)
    is a reasonable proxy signal. This composite is itself one of the
    input features, engineered from the others.
    """
    return float(np.clip(texture * 0.6 + (1 - oiliness) * 0.3 + redness * 0.1, 0, 1))


def extract_features(path_or_bytes):
    """
    Main entry point: image -> dict of named features -> ordered vector.
    Returns (feature_dict, feature_vector) where feature_vector is the
    exact input the ML model expects (see model.py FEATURE_ORDER).
    """
    img = load_image(path_or_bytes)
    mask = _skin_mask(img)

    redness = redness_score(img, mask)
    oiliness = oiliness_score(img, mask)
    texture = texture_roughness(img, mask)
    spots = dark_spot_count(img, mask)
    wrinkles = wrinkle_score(img, mask)
    dryness = dryness_score(oiliness, texture, redness)

    feats = {
        "redness": redness,
        "oiliness": oiliness,
        "texture": texture,
        "dark_spots": spots,
        "wrinkles": wrinkles,
        "dryness": dryness,
    }
    vector = np.array([feats[k] for k in FEATURE_ORDER], dtype=np.float32)
    return feats, vector


FEATURE_ORDER = ["redness", "oiliness", "texture", "dark_spots", "wrinkles", "dryness"]
