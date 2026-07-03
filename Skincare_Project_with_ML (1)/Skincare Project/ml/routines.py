"""
routines.py
─────────────────────────────────────────────────────────
Turns the ML model's detected concerns into an actual personalized
routine + product recommendations, instead of a hardcoded routine
everyone sees regardless of their photo.

This is rule-based (not a separate ML model) — dermatology routines
follow well-established logic ("if acne is high, use salicylic acid;
if dry, avoid harsh actives"), so an expert-system approach here is
more appropriate and more controllable than training another model
on synthetic data. The ML part of this project is the DETECTION
(features.py + model.py); this file is the DECISION layer that acts
on what was detected.
"""

# Each step: id must match a data-category in products.html so the
# "View product" link can jump straight to the relevant section.
BASE_MORNING = [
    {"name": "Gentle Cleanser", "category": "cleanser",
     "note": "Wash with lukewarm water to remove overnight buildup without stripping moisture.",
     "time": "2 min"},
]
BASE_NIGHT = [
    {"name": "Cleanser (Double Cleanse if wearing sunscreen/makeup)", "category": "cleanser",
     "note": "Remove sunscreen, makeup and pollution buildup from the day.",
     "time": "2 min"},
]

SUNSCREEN_STEP = {"name": "SPF 40+ Sunscreen", "category": "sunscreen",
                   "note": "Apply generously as the last morning step. Reapply every 2 hours outdoors.",
                   "time": "Must", "tag": "rose"}
MOISTURIZER_STEP = {"name": "Moisturizer", "category": "moisturizer",
                     "note": "Lock in hydration as the final step (before sunscreen in the morning).",
                     "time": "1 min"}


def _step(name, category, note, time="1 min", tag="blue"):
    return {"name": name, "category": category, "note": note, "time": time, "tag": tag}


def build_routine(problems: list) -> dict:
    """
    problems: the list from model.predict()['problems'], each with
    'concern' and 'level' ('none'|'low'|'moderate'|'high').
    Returns {"morning": [...], "night": [...], "recommended_products": [...]}
    """
    levels = {p["concern"]: p["level"] for p in problems}
    active = lambda c: levels.get(c) in ("moderate", "high")
    high = lambda c: levels.get(c) == "high"

    morning = list(BASE_MORNING)
    night = list(BASE_NIGHT)
    recs = []  # (product category, reason) shown as "recommended for you"

    # --- Oiliness ---
    if active("oiliness"):
        morning.append(_step("Niacinamide Toner", "serum",
                              "Controls oil production and minimizes the look of pores.", "1 min"))
        recs.append(("serum", "Detected oiliness — niacinamide helps regulate sebum."))

    # --- Acne ---
    if active("acne"):
        night.append(_step("Salicylic Acid Treatment", "serum",
                            "Unclogs pores and reduces active breakouts. Apply to affected areas only.",
                            "2-3x/week" if not high("acne") else "Nightly", "yellow"))
        recs.append(("serum", "Detected acne — a BHA/salicylic acid product targets breakouts directly."))

    # --- Dark spots ---
    if active("dark_spots"):
        morning.append(_step("Vitamin C Serum", "serum",
                              "Brightens skin tone and fades dark spots/hyperpigmentation over time.", "1 min"))
        night.append(_step("Retinol (2-3x per week)", "serum",
                            "Promotes cell turnover to fade dark spots. Start low concentration, nights only.",
                            "3x/week", "yellow"))
        recs.append(("serum", "Detected dark spots — vitamin C (AM) + retinol (PM) is the standard pairing."))

    # --- Redness ---
    if active("redness"):
        night.append(_step("Centella / Niacinamide Calming Serum", "serum",
                            "Soothes irritation and visible redness.", "1 min"))
        recs.append(("serum", "Detected redness — a calming, fragrance-free serum reduces irritation."))

    # --- Dryness ---
    if active("dryness"):
        morning.append(_step("Hydrating Serum (Hyaluronic Acid)", "serum",
                              "Boosts water content before locking in with moisturizer.", "1 min"))
        recs.append(("moisturizer", "Detected dryness — prioritize a richer, hydrating moisturizer."))
    else:
        recs.append(("moisturizer", "Lightweight, oil-free moisturizer suits your skin's current oil balance."))

    # --- Wrinkles ---
    if active("wrinkles"):
        night.append(_step("Peptide / Retinol Night Cream", "moisturizer",
                            "Supports collagen and softens the look of fine lines overnight.", "1 min"))
        recs.append(("moisturizer", "Detected early fine lines — a peptide-rich night cream helps long-term."))

    # Moisturizer + sunscreen always last, always relevant
    morning.append(MOISTURIZER_STEP)
    morning.append(SUNSCREEN_STEP)
    night.append(_step("Night Cream / Sleeping Mask", "moisturizer",
                        "Lock in moisture overnight for repair and recovery while you sleep.", "1 min"))
    recs.append(("cleanser", "A gentle, non-stripping cleanser is the safe daily base for any routine."))

    # Number the steps for display
    for i, s in enumerate(morning, 1):
        s["num"] = i
    for i, s in enumerate(night, 1):
        s["num"] = i

    # De-duplicate recommended product categories, keep first reason for each
    seen = {}
    for cat, reason in recs:
        seen.setdefault(cat, reason)
    recommended_products = [{"category": c, "reason": r} for c, r in seen.items()]

    return {"morning": morning, "night": night, "recommended_products": recommended_products}
