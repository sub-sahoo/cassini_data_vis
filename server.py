"""
Flask server for the Cassini Dust Analyzer Explorer.
Serves static frontend files and data APIs.
"""

import json
import numpy as np
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder="static", static_url_path="")
CORS(app)

metadata = None
spectra = None


def load_data():
    global metadata, spectra
    print("Loading preprocessed data ...")
    with open("data/metadata.json", "r") as f:
        metadata = json.load(f)
    spectra = np.load("data/spectra.npy", mmap_mode="r", allow_pickle=True)
    print(f"  Metadata: {metadata['_row_count']} rows")
    print(f"  Spectra: {spectra.shape}")


@app.route("/")
def index():
    return send_from_directory("static", "index.html")


@app.route("/api/metadata")
def api_metadata():
    return jsonify(metadata)


@app.route("/api/spectrum/<int:row_idx>")
def api_spectrum(row_idx):
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
    """Return the mean spectrum for a set of indices."""
    indices = request.json.get("indices", [])
    if not indices:
        return jsonify({"error": "No indices provided"}), 400
    valid = [i for i in indices if 0 <= i < spectra.shape[0]]
    if not valid:
        return jsonify({"error": "No valid indices"}), 400
    mean_spec = spectra[valid].mean(axis=0).tolist()
    return jsonify({"spectrum": mean_spec, "count": len(valid)})


if __name__ == "__main__":
    load_data()
    print("Starting server at http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=False)
