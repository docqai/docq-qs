import os
from .quickstart import chat, answer, chain, doc, agent
from .eventloop import run
from .data import load_web_data
from .brain import answer_via_agent as answer_brain_agent, answer_via_chain as answer_brain_chain

os.environ['OPENAI_API_KEY'] = "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"