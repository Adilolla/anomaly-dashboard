import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parents[1] / 'src'))
from preprocessing.telemetry import vectorize
from inference.scoring import classify, evaluation_metrics

def test_vectorize_supports_sparse_multivariate_event():
    assert vectorize({'cpu_usage': 10, 'memory_usage': 20}) == [10.0, 20.0, 0.0, 0.0, 0.0, 0.0]

def test_threshold_is_inclusive():
    assert classify(0.5, 0.5) is True

def test_metrics_are_computed_from_labels():
    metrics = evaluation_metrics([0.1, 0.9, 0.8, 0.2], [False, True, False, False], 0.5)
    assert metrics['recall'] == 1.0 and metrics['false_positive_rate'] == 1.0
