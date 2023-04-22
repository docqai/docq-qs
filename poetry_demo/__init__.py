import os
from .brain import answer_via_agent as answer_brain_agent, answer_via_chain as answer_brain_chain

os.environ['OPENAI_API_KEY'] = "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"
os.environ['COHERE_API_KEY'] = "MIuxphzsU5rXofRKHhaAD4ir6nZ0ionjTlfVM4WL"
os.environ['SERPER_API_KEY'] = "1599ca9959b2988bd37583c23f4ef54f207f5af7"