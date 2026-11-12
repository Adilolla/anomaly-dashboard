"""Compatibility entrypoint; inference is now event-driven."""
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'services' / 'inference' / 'src'))
from worker import InferenceWorker

if __name__ == '__main__':
    InferenceWorker().run()
