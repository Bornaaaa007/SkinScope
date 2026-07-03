"""
train.py
─────────────────────────────────────────────────────────
STEP 2 of the ML pipeline: TRAIN a model that maps the 6 features
from features.py to skin concerns and severity levels.

⚠️ IMPORTANT HONESTY NOTE
We don't have a real labeled photo dataset. So instead of pretending,
this script generates synthetic training examples using rules a
dermatologist-informed heuristic would follow (e.g. "high redness
+ many dark spots = likely acne"), plus random noise so the model
has to generalize rather than memorize.

This is a legitimate way to bootstrap a first model (it's the same
idea as "weak supervision"). The model.py / app.py code around it
doesn't change at all once you have REAL data — you'd just replace
the make_synthetic_dataset() function below with code that loads
your real labeled photos through features.py. See the bottom of
this file for exactly how to do that later.

Run this once:  python train.py
It writes model.joblib into this folder.
"""

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

from features import FEATURE_ORDER

RNG = np.random.default_rng(42)

CONCERNS = ["acne", "dryness", "oiliness", "redness", "dark_spots", "wrinkles"]
LEVELS = ["none", "low", "moderate", "high"]


def _severity(value):
    """Turn a continuous 0-1 score into one of the 4 severity labels."""
    if value < 0.15:
        return "none"
    elif value < 0.40:
        return "low"
    elif value < 0.65:
        return "moderate"
    else:
        return "high"


def make_synthetic_dataset(n=4000):
    """
    Generate n synthetic (feature_vector -> concern severities) examples.

    Each row simulates a plausible face: we sample the 6 base features,
    let them correlate the way real skin does (e.g. oily skin tends to
    have MORE acne, dry skin tends to have redness from irritation),
    then derive each concern's severity from a combination of features
    plus noise — exactly the kind of relationship a real dataset would
    also contain, just cleaner.
    """
    redness = RNG.beta(2, 4, n)
    oiliness = RNG.beta(2, 3, n)
    texture = RNG.beta(2, 4, n)
    wrinkles = RNG.beta(2, 5, n)

    # correlated features (dark spots rise with redness/texture; dryness rises when oiliness is low)
    dark_spots = np.clip(0.5 * redness + 0.5 * texture + RNG.normal(0, 0.1, n), 0, 1)
    dryness = np.clip(0.6 * texture + 0.3 * (1 - oiliness) + RNG.normal(0, 0.08, n), 0, 1)

    X = np.stack([redness, oiliness, texture, dark_spots, wrinkles, dryness], axis=1)

    # Derive each concern severity as a weighted combo of relevant features + noise.
    acne_raw = 0.45 * redness + 0.35 * dark_spots + 0.25 * oiliness + RNG.normal(0, 0.05, n)
    dryness_raw = dryness + RNG.normal(0, 0.05, n)
    oiliness_raw = oiliness + RNG.normal(0, 0.05, n)
    redness_raw = redness + RNG.normal(0, 0.05, n)
    darkspot_raw = dark_spots + RNG.normal(0, 0.05, n)
    wrinkle_raw = wrinkles + RNG.normal(0, 0.05, n)

    y = {
        "acne": np.array([_severity(v) for v in np.clip(acne_raw, 0, 1)]),
        "dryness": np.array([_severity(v) for v in np.clip(dryness_raw, 0, 1)]),
        "oiliness": np.array([_severity(v) for v in np.clip(oiliness_raw, 0, 1)]),
        "redness": np.array([_severity(v) for v in np.clip(redness_raw, 0, 1)]),
        "dark_spots": np.array([_severity(v) for v in np.clip(darkspot_raw, 0, 1)]),
        "wrinkles": np.array([_severity(v) for v in np.clip(wrinkle_raw, 0, 1)]),
    }
    return X.astype(np.float32), y


def train():
    X, y = make_synthetic_dataset()
    X_train, X_test, idx_train, idx_test = train_test_split(
        X, np.arange(len(X)), test_size=0.2, random_state=42
    )

    models = {}
    print(f"Training on {len(X_train)} examples, testing on {len(X_test)}\n")

    for concern in CONCERNS:
        y_train = y[concern][idx_train]
        y_test = y[concern][idx_test]

        clf = RandomForestClassifier(
            n_estimators=200, max_depth=6, random_state=42, class_weight="balanced"
        )
        clf.fit(X_train, y_train)

        preds = clf.predict(X_test)
        acc = (preds == y_test).mean()
        print(f"[{concern}] accuracy on held-out synthetic test set: {acc:.2%}")

        models[concern] = clf

    joblib.dump({"models": models, "feature_order": FEATURE_ORDER, "levels": LEVELS}, "model.joblib")
    print("\nSaved trained model -> model.joblib")


if __name__ == "__main__":
    train()

# ─────────────────────────────────────────────────────────
# HOW TO RETRAIN ON REAL PHOTOS LATER
# ─────────────────────────────────────────────────────────
# 1. Collect real photos, one folder per concern/severity, e.g.:
#      data/acne/high/*.jpg, data/acne/low/*.jpg, ...
#    (Public datasets exist on Kaggle for acne severity, e.g. search
#    "acne severity dataset" or "ISIC skin dataset" — download them yourself
#    since this sandbox can't reach Kaggle.)
# 2. Replace make_synthetic_dataset() with a function that walks those
#    folders, calls features.extract_features(path) on each photo, and
#    collects (vector, label) pairs into X and y — same shapes as above.
# 3. Everything else (RandomForestClassifier, saving to model.joblib,
#    app.py) stays exactly the same.
