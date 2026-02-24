SPECTRA_PATH="$(pwd)/data/spectra.npy"
METADATA_PATH="$(pwd)/data/metadata.json"

if [[ -f "$SPECTRA_PATH" && -f "$METADATA_PATH" ]]; then
    echo "$SPECTRA_PATH exists"
    echo "$METADATA_PATH exists"
    echo "Data Files exist, skipping preprocessing..."
else
    echo "One or more data file missing. Running preprocessing..."
    python3 preprocess.py
fi  

echo "Running server..."
python3 server.py