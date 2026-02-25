"""
Flask server for the Cassini Dust Analyzer Explorer.
Serves static frontend files and data APIs.
Loads data from local disk or from a Google Drive folder when GOOGLE_DRIVE_FOLDER_URL is set.
"""

import json
import os
import tempfile

import gdown
from dotenv import load_dotenv

load_dotenv()  # load .env into os.environ for local dev
import numpy as np
from flask import Flask, Response, jsonify, request, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder="static", static_url_path="")
CORS(app)

metadata = None
spectra = None


def load_data():
    global metadata, spectra
    folder_url = os.environ.get("GOOGLE_DRIVE_FOLDER_URL", "").strip()
    if folder_url:
        # Pull from Google Drive with gdown
        # use_cookies=False avoids writing to ~/.cache (read-only on Vercel)
        print("Loading data from Google Drive", folder_url[:50], "...")
        with tempfile.TemporaryDirectory() as tmp:
            gdown.download_folder(folder_url, output=tmp, quiet=True, use_cookies=False)
            with open(os.path.join(tmp, "metadata.json"), "r") as f:
                metadata = json.load(f)
            spectra = np.load(os.path.join(tmp, "spectra.npy"), allow_pickle=True)
    else:
        # Local disk (dev)
        print("Loading preprocessed data from disk ...")
        with open("data/metadata.json", "r") as f:
            metadata = json.load(f)
        spectra = np.load("data/spectra.npy", mmap_mode="r", allow_pickle=True)
    print(f"  Metadata: {metadata['_row_count']} rows")
    print(f"  Spectra: {spectra.shape}")


def ensure_data():
    global metadata
    if metadata is None:
        load_data()


@app.route("/")
def index():
    return send_from_directory("static", "index.html")


@app.route("/favicon.ico")
def favicon():
    return send_from_directory("static", "favicon.ico")


@app.route("/api/metadata")
def api_metadata():
    ensure_data()
    # Stream to avoid Vercel's 4.5MB response limit
    def generate():
        for chunk in json.JSONEncoder().iterencode(metadata):
            yield chunk
    return Response(generate(), mimetype="application/json")


@app.route("/api/spectrum/<int:row_idx>")
def api_spectrum(row_idx):
    ensure_data()
    if row_idx < 0 or row_idx >= spectra.shape[0]:
        return jsonify({"error": "Index out of range"}), 404
    spec = spectra[row_idx].tolist()
    return jsonify({
        "spectrum": spec,
        "a": metadata["a"][row_idx],
        "t0": metadata["t0"][row_idx],
    })


@app.route("/api/spectra_batch", methods=["POST"])
def api_spectra_batch():
    ensure_data()
    """Return spectra for multiple indices (max 50 at a time)."""
    indices = request.json.get("indices", [])
    indices = indices[:50]
    result = []
    for idx in indices:
        if 0 <= idx < spectra.shape[0]:
            result.append(spectra[idx].tolist())
    return jsonify({"spectra": result, "indices": indices})


@app.route("/api/mean_spectrum", methods=["POST"])
def api_mean_spectrum():
    ensure_data()
    """Return the mean spectrum for a set of indices."""
    indices = request.json.get("indices", [])
    if not indices:
        return jsonify({"error": "No indices provided"}), 400
    valid = [i for i in indices if 0 <= i < spectra.shape[0]]
    if not valid:
        return jsonify({"error": "No valid indices"}), 400
    mean_spec = spectra[valid].mean(axis=0).tolist()
    return jsonify({"spectrum": mean_spec, "count": len(valid)})


@app.errorhandler(500)
def handle_500(e):
    """Return JSON errors so frontend doesn't get HTML."""
    return jsonify({"error": str(e) if str(e) else "Internal server error"}), 500


if __name__ == "__main__":
    load_data()
    print("Starting server at http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=False)
