# Cassini Dust Analyzer Explorer

Interactive dashboard for exploring Cassini Cosmic Dust Analyzer (CDA) data — Saturn ring-plane map, mass spectra, chemistry filters, and more.

## Prerequisites

- Python 3
- Pip

## Setup

1. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

2. **Prepare data** (first run)

   Place `ConfDataSpicy.csv` in the `data/` directory. The preprocessing step will generate `metadata.json` and `spectra.npy`.

## Running the Server

Use the provided script:

```bash
./run_server.sh
```

If you get a permission denied error, make it executable first:

```bash
chmod +x run_server.sh
./run_server.sh
```

Or run it with bash:

```bash
bash run_server.sh
```

### What the script does

- **Checks for preprocessed data** (`data/spectra.npy` and `data/metadata.json`)
- **If missing** — runs `preprocess.py` to build metadata and spectra from `data/ConfDataSpicy.csv`
- **Starts the server** at [http://localhost:5000](http://localhost:5000)

## DIY

If you prefer to run steps yourself:

```bash
# Optional: preprocess raw data (only needed when metadata/spectra are missing)
python3 preprocess.py

# Start the server
python3 server.py
```

## Usage

1. Go to app deployed at Vercel [here](https://cassini-data-vis.vercel.app)
   - Open [http://localhost:5000](http://localhost:5000) in a browser if runn
2. Use the **top filter bar** to filter by chemistry, time, radius, inclination, and confidence.
3. **Add widgets** from the left palette (Saturn Map, Street View, Mass Spectrum, Periodic Table).
4. **Drag** a widget by its header bar to move it; **resize** by dragging the corners.
5. **Pan** the Saturn map by dragging on the map itself (not the header).
