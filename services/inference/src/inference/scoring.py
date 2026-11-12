def classify(score, threshold):
    if threshold < 0:
        raise ValueError('threshold must be non-negative')
    return score >= threshold

def evaluation_metrics(scores, labels, threshold):
    predictions = [classify(score, threshold) for score in scores]
    tp = sum(p and y for p, y in zip(predictions, labels)); tn = sum(not p and not y for p, y in zip(predictions, labels))
    fp = sum(p and not y for p, y in zip(predictions, labels)); fn = sum(not p and y for p, y in zip(predictions, labels))
    precision = tp / (tp + fp) if tp + fp else 0.0; recall = tp / (tp + fn) if tp + fn else 0.0
    return {'precision': precision, 'recall': recall, 'f1': 2 * precision * recall / (precision + recall) if precision + recall else 0.0, 'false_positive_rate': fp / (fp + tn) if fp + tn else 0.0, 'false_negative_rate': fn / (fn + tp) if fn + tp else 0.0}
