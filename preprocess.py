"""
Preprocess the Cassini CDA dataset into fast-loading formats.
Creates:
  - data/metadata.json  (compact columnar metadata for all 28K grains)
  - data/spectra.npy     (28145 x 1280 float32 array of mass spectra)
"""

import pandas as pd
import numpy as np
import json
import os
import time

DATA_DIR = "data"
CSV_PATH = os.path.join(DATA_DIR, "ConfDataSpicy.csv")

METADATA_COLS = [
    "EventID", "UTC", "ET", "R_sat", "Z_ring", "Inclination", "R_ring",
    "Phi2008", "PhiObs", "X2D", "Y2D", "X_obs", "Y_obs", "Z_obs",
    "V_sc", "Vrel_dust",
    "Enceladus_Dist", "Rhea_Dist", "Dione_Dist", "Tethys_Dist",
    "Titan_Dist", "Mimas_Dist",
    "a", "t0", "Confidence", "SNR",
    "M3 Category", "M2 Category",
    "Latent1", "Latent2", "M3 Theta", "M3 R", "RF score",
]

MASS_RANGE = (0, 200)
NUM_BINS = 1280

ELEMENT_MASSES = {
    "H": 1, "C": 12, "N": 14, "O": 16, "F": 19,
    "Na": 23, "Mg": 24, "Al": 27, "Si": 28, "P": 31,
    "S": 32, "Cl": 35, "K": 39, "Ca": 40, "Ti": 48,
    "Cr": 52, "Mn": 55, "Fe": 56, "Ni": 58, "Cu": 63,
    "Zn": 65, "Rb": 85, "Sr": 88,
}

# Species explicitly named in CompositionalClassificationTable.xlsx
MOLECULE_MASSES = {
    "H2O": 18,    # 1L, 2W, 3W
    "HCN": 27,    # 2W [HCN]+
    "HCO": 29,    # 2W [HCO]+
    "C6H6": 78,   # 2O
}


def mass_to_bin(mass_amu):
    return int(round(mass_amu * (NUM_BINS - 1) / MASS_RANGE[1]))


def find_peaks_simple(spectrum, prominence_factor=3.0, min_distance=5):
    """Simple peak detection: local maxima above median * prominence_factor."""
    median = np.median(spectrum)
    std = np.std(spectrum)
    threshold = median + prominence_factor * std
    peaks = []
    for i in range(min_distance, len(spectrum) - min_distance):
        if spectrum[i] <= threshold:
            continue
        is_peak = True
        for j in range(1, min_distance + 1):
            if spectrum[i] < spectrum[i - j] or spectrum[i] < spectrum[i + j]:
                is_peak = False
                break
        if is_peak:
            peaks.append(i)
    return peaks

 
def _is_mass_col(name):
    """True if column name is a numeric mass value (0.0..200)."""
    try:
        v = float(name)
        return 0 <= v <= 200
    except (TypeError, ValueError):
        return False


def detect_elements(spectrum, tolerance_bins=4):
    """Check which elements have significant peaks near their expected mass."""
    peaks = set(find_peaks_simple(spectrum))
    present = []
    all_masses = {**ELEMENT_MASSES, **MOLECULE_MASSES}
    for name, mass in all_masses.items():
        target_bin = mass_to_bin(mass)
        for offset in range(-tolerance_bins, tolerance_bins + 1):
            if (target_bin + offset) in peaks:
                present.append(name)
                break
    return present


def main():
    t0 = time.time()

    print(f"Loading {CSV_PATH} ...")
    df = pd.read_csv(CSV_PATH)
    print(f"  {len(df)} rows, {len(df.columns)} columns  ({time.time()-t0:.1f}s)")

    print("\nCalibration stats:")
    print(f"  a: mean={df['a'].mean():.6f}, std={df['a'].std():.6f}")
    print(f"  t0: mean={df['t0'].mean():.6f}, std={df['t0'].std():.6f}")

    print("\nCategory distribution:")
    print(df["M3 Category"].value_counts().to_string())

    # --- Build metadata (columnar JSON) ---
    print("\nBuilding metadata ...")
    metadata = {}
    for col in METADATA_COLS:
        vals = df[col].tolist()
        if df[col].dtype in (np.float64, np.float32):
            vals = [None if (v == -999.0 or np.isnan(v)) else round(v, 6) for v in vals]
        elif df[col].dtype in (np.int64, np.int32):
            vals = [None if v == -999 else int(v) for v in vals]
        metadata[col] = vals
    metadata["_row_count"] = len(df)

    # --- Extract spectra ---
    print("Extracting spectra ...")
    spec_cols = [c for c in df.columns if _is_mass_col(c)]
    spec_cols = sorted(spec_cols, key=lambda x: float(x))[:NUM_BINS]
    if len(spec_cols) != NUM_BINS:
        raise ValueError(
            f"Expected {NUM_BINS} spectrum columns, found {len(spec_cols)}. "
            "Check CSV format."
        )
    spectra = df[spec_cols].values.astype(np.float32)

    # --- Detect element presence per spectrum ---
    print("Detecting element peaks (this may take a minute) ...")
    element_flags = []
    for i in range(len(spectra)):
        present = detect_elements(spectra[i])
        element_flags.append(present)
        if (i + 1) % 5000 == 0:
            print(f"  {i+1}/{len(spectra)} ...")

    metadata["elements_present"] = element_flags

    # --- Save ---
    meta_path = os.path.join(DATA_DIR, "metadata.json")
    print(f"\nSaving {meta_path} ...")
    with open(meta_path, "w") as f:
        json.dump(metadata, f)
    meta_size = os.path.getsize(meta_path) / 1e6
    print(f"  {meta_size:.1f} MB")

    spec_path = os.path.join(DATA_DIR, "spectra.npy")
    print(f"Saving {spec_path} ...")
    np.save(spec_path, spectra)
    spec_size = os.path.getsize(spec_path) / 1e6
    print(f"  {spec_size:.1f} MB")

    print(f"\nDone in {time.time()-t0:.1f}s")


if __name__ == "__main__":
    main()
