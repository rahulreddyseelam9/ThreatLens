from sklearn.ensemble import RandomForestClassifier


class ThreatModel:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.model_version = "baseline-rf-v1"
        self.feature_names = [
            "risk_score", "confidence", "malicious_count", "suspicious_count",
            "abuse_score", "otx_reputation", "pulse_count", "urlhaus_listed",
            "provider_count", "agreement_ratio", "emerging_score", "related_indicator_count"
        ]

    def train(self, X, y):
        self.model.fit(X, y)
        return self

    def predict(self, features):
        values = [[features.get(name, 0) for name in self.feature_names]]
        prediction = self.model.predict(values)[0]
        probabilities = self.model.predict_proba(values)[0].tolist()
        return int(prediction), probabilities
