import re
from typing import Dict, List


class SensitiveDataDetector:
    PATTERNS = {
        'phone': re.compile(r'1[3-9]\d{9}'),
        'id_card': re.compile(r'\d{17}[\dXx]|\d{15}'),
        'email': re.compile(r'[\w.-]+@[\w.-]+\.\w+'),
    }

    SENSITIVE_KEYWORDS = ['密码', 'password', 'pwd', '密钥', 'secret', 'key', 'token', 'api_key']

    def detect(self, text: str) -> Dict:
        result = {'has_sensitive': False, 'types': [], 'positions': [], 'keywords': []}

        for data_type, pattern in self.PATTERNS.items():
            for match in pattern.finditer(text):
                result['has_sensitive'] = True
                result['types'].append(data_type)
                result['positions'].append({'start': match.start(), 'end': match.end(), 'type': data_type})

        text_lower = text.lower()
        for keyword in self.SENSITIVE_KEYWORDS:
            if keyword.lower() in text_lower:
                result['has_sensitive'] = True
                result['keywords'].append(keyword)

        return result
