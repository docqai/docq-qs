import os
import langchain
from langchain import LLMChain, Wikipedia
from langchain.agents import load_tools, initialize_agent, Tool
from langchain.agents.react.base import DocstoreExplorer
from langchain.chains import SimpleSequentialChain, LLMMathChain
from langchain.document_loaders import PyPDFLoader
from langchain.indexes import VectorstoreIndexCreator
from langchain.llms import OpenAI, Cohere, HuggingFaceHub
from langchain.chat_models import ChatOpenAI
from langchain.schema import (
    AIMessage,
    HumanMessage,
    SystemMessage,
)
from langchain.prompts import PromptTemplate
from langchain.prompts.chat import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
)


def chat(text):
    chatgpt = ChatOpenAI(model_name='gpt-3.5-turbo')

    return chatgpt([
        HumanMessage(content=text),
    ])


def answer(text):
    gpt3 = OpenAI(model_name='text-davinci-003')

    return gpt3(text)


def chain(product):
    chain_company = LLMChain(
        llm=ChatOpenAI(model_name='gpt-3.5-turbo', temperature=0.9),
        prompt=ChatPromptTemplate.from_messages([  
            HumanMessagePromptTemplate(
                prompt=PromptTemplate(
                    template="What is a good company name for a company that makes {product}?",
                    input_variables=["product"]
                ),
            ),
        ]),
    )

    chain_slogan = LLMChain(
        llm=OpenAI(model_name='text-davinci-003', temperature=0.1),
        prompt=PromptTemplate(
            template="What is a good slogan for the following company: {company}?",
            input_variables=["company"],
        )
    )

    chain = SimpleSequentialChain(
        chains=[chain_company, chain_slogan],
        verbose=True,
    )

    return chain.run(product)


def doc(question):
    loader = PyPDFLoader(os.path.join(os.path.dirname(__file__), "../data.pdf"))
    index = VectorstoreIndexCreator().from_loaders([loader])

    return index.query(question)


def agent(question):
    gpt3 = OpenAI(model_name='text-davinci-003', temperature=0)

    prompt = PromptTemplate(
        input_variables=["query"],
        template="{query}",   
    )

    math_tool = Tool(
        name='Calculator',
        func=LLMMathChain(llm=gpt3).run,
        description='Useful for when you need to do simple math.'
    )

    llm_tool = Tool(
        name='Language Model',
        func=LLMChain(llm=gpt3, prompt=prompt).run,
        description='Useful for general purpose queries and logic.'
    )

    docstore = DocstoreExplorer(Wikipedia())

    tools = [
        llm_tool,
        math_tool, 
        Tool(
            name='Search Wikipedia',
            func=docstore.search,
            description='Search Wikipedia.'
        ),
        Tool(
            name='Lookup Wikipedia',
            func=docstore.lookup,
            description='Lookup a term in Wikipedia.'
        ),
    ]

    agent = initialize_agent(
        agent='zero-shot-react-description',
        tools=tools,
        llm=gpt3,
        verbose=True,
        max_iterations=5,
    )

    return agent(question)