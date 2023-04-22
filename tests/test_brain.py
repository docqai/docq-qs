import pytest
from source import answer_brain_chain, answer_brain_agent


SAMPLE_QUESTION = "Give me examples of new tools appearing in technology radar?"


def test_answer_via_chain():
    text = answer_brain_chain(SAMPLE_QUESTION)
    assert text is not None
    print(text)


def test_answer_via_agent():
    text = answer_brain_agent(SAMPLE_QUESTION)
    assert text is not None
    print(text)