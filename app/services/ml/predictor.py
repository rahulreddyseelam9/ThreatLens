from app.services.ml.feature_extractor import FeatureExtractor
from app.services.ml.threat_model import ThreatModel


class ThreatPredictor:
    def __init__(self):
        self.model = ThreatModel()
        self._train_fallback_model()

    def _train_fallback_model(self):
        X = [
            [10, 10, 0, 0, 0, 0, 0, 0, 1, 0, 5, 0],
            [60, 65, 4, 3, 20, 10, 2, 0, 2, 60, 50, 1],
            [90, 90, 15, 10, 80, 50, 8, 1, 3, 90, 85, 7],
            [25, 20, 1, 0, 2, 0, 0, 0, 1, 10, 20, 0],
        ]
        y = [0, 1, 2, 0]
        self.model.train(X, y)

    def predict(self, analysis_result):
        if not analysis_result or not isinstance(analysis_result, dict):
            return {
                "prediction": "UNKNOWN",
                "probabilities": {},
                "model_version": "unavailable",
                "features_used": [],
                "status": "INSUFFICIENT_DATA",
            }

        features = FeatureExtractor.extract(analysis_result)
        if not features or all((value in (None, 0)) for value in features.values()):
            return {
                "prediction": "UNKNOWN",
                "probabilities": {},
                "model_version": "unavailable",
                "features_used": list(self.model.feature_names),
                "status": "INSUFFICIENT_DATA",
            }

        try:
            prediction, probabilities = self.model.predict(features)
        except Exception:
            return {
                "prediction": "UNKNOWN",
                "probabilities": {},
                "model_version": "unavailable",
                "features_used": list(self.model.feature_names),
                "status": "MODEL_UNAVAILABLE",
            }

        label = "SAFE" if prediction == 0 else "SUSPICIOUS" if prediction == 1 else "HIGH_RISK"
        probability_map = {"SAFE": float(probabilities[0]), "SUSPICIOUS": float(probabilities[1]), "HIGH_RISK": float(probabilities[2])} if len(probabilities) == 3 else {"value": float(probabilities[0])}
        return {
            "prediction": label,
            "probabilities": probability_map,
            "model_version": self.model.model_version,
            "features_used": list(self.model.feature_names),
            "status": "AVAILABLE",
        }
