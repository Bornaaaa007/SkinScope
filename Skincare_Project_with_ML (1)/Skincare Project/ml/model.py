"""
model.py
─────────────────────────────────────────────────────────
STEP 3: load the trained model (model.joblib) and turn a feature
vector into a friendly result: per-concern severity + an overall
skin health score.
"""

import os
import joblib
import numpy as np

_MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.joblib")
_bundle = None  # lazy-loaded so importing this file is cheap


def _load():
    global _bundle
    if _bundle is None:
        if not os.path.exists(_MODEL_PATH):
            raise FileNotFoundError(
                "model.joblib not found. Run `python train.py` in the ml/ folder first."
            )
        _bundle = joblib.load(_MODEL_PATH)
    return _bundle


LEVEL_TO_ICON = {"none": "🟢", "low": "🟢", "moderate": "🟡", "high": "🔴"}
LEVEL_TO_SCORE_PENALTY = {"none": 0, "low": 5, "moderate": 12, "high": 22}
DISPLAY_NAME = {
    "acne": "Acne & Breakouts",
    "dryness": "Dryness",
    "oiliness": "Oiliness",
    "redness": "Redness",
    "dark_spots": "Dark Spots",
    "wrinkles": "Wrinkles",
}


def predict(feature_vector: np.ndarray) -> dict:
    """
    feature_vector: the 6-value array from features.extract_features().
    Returns a JSON-serializable dict ready to send to the frontend.
    """
    bundle = _load()
    models = bundle["models"]

    x = feature_vector.reshape(1, -1)
    problems = []
    total_penalty = 0

    for concern, clf in models.items():
        level = clf.predict(x)[0]
        proba = clf.predict_proba(x)[0]
        confidence = float(np.max(proba))

        problems.append({
            "concern": concern,
            "name": DISPLAY_NAME[concern],
            "level": level,
            "icon": LEVEL_TO_ICON[level],
            "confidence": round(confidence, 2),
        })
        total_penalty += LEVEL_TO_SCORE_PENALTY[level]

    score = int(np.clip(100 - total_penalty, 0, 100))
    skin_type = _infer_skin_type(problems)

    return {
        "score": score,
        "skin_type": skin_type,
        "problems": problems,
    }


def _infer_skin_type(problems: list) -> str:
    levels = {p["concern"]: p["level"] for p in problems}
    oily = levels["oiliness"] in ("moderate", "high")
    dry = levels["dryness"] in ("moderate", "high")
    if oily and dry:
        return "Combination Skin"
    if oily:
        return "Oily Skin"
    if dry:
        return "Dry Skin"
    return "Normal Skin"
