"""
app.py
─────────────────────────────────────────────────────────
STEP 4: a tiny web server (Flask) that your existing HTML/JS frontend
talks to. It exposes ONE endpoint:

    POST /api/analyze   (multipart/form-data, field name "photo")
    -> JSON: { score, skin_type, problems: [...] }

This is the bridge between diagnose.html (which has the upload UI
already built) and the ML model in model.py.

RUN IT:
    cd ml
    pip install -r requirements.txt
    python app.py
Then open the site (see README.md) and use the Diagnose page normally.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS

import features
import model
import routines

app = Flask(__name__)
CORS(app)  # allows the HTML page (served separately) to call this API

ALLOWED_EXT = {"jpg", "jpeg", "png", "webp"}


@app.route("/api/analyze", methods=["POST"])
def analyze():
    if "photo" not in request.files:
        return jsonify({"error": "No file uploaded. Expected form field 'photo'."}), 400

    file = request.files["photo"]
    if file.filename == "":
        return jsonify({"error": "Empty filename."}), 400

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXT:
        return jsonify({"error": f"Unsupported file type '{ext}'. Use JPG, PNG, or WEBP."}), 400

    try:
        img_bytes = file.read()
        _, vector = features.extract_features(img_bytes)
        result = model.predict(vector)
        result["routine"] = routines.build_routine(result["problems"])
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    # debug=True auto-reloads on code changes -- turn off in real deployment
    app.run(host="0.0.0.0", port=5000, debug=True)
