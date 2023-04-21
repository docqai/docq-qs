import pytest
from poetry_demo import chat, answer, chain, doc, agent


def test_chat():
    text = chat("How has your day been?")
    assert text is not None
    print(text)


def test_answer():
    text = answer("How to define happiness?")
    assert text is not None
    print(text)


def test_chain():
    text = chain("wild salmon")
    assert text is not None
    print(text)


def test_doc():
    text = doc("What are the top-3 libraries to be evaluated?")
    assert text is not None
    print(text)


def test_agent_math():
    text = agent("There are 20 people in the room. Every hour one person leaves. How many people are there after 3 hours?")
    assert text is not None
    print(text)


def test_agent_llm_math():
    text = agent("Find out London's population in 2019 first. From that year, find out London's population trend. With that rate, how many people are there in London in year 2049?")
    assert text is not None
    print(text)