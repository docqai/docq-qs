import os
import langchain
from langchain import LLMChain, Wikipedia
from langchain.vectorstores import Chroma
from langchain.agents import load_tools, initialize_agent, Tool
from langchain.agents.react.base import DocstoreExplorer
from langchain.chains import SimpleSequentialChain, LLMMathChain, RetrievalQA, RetrievalQAWithSourcesChain
from langchain.document_loaders import PyPDFLoader
from langchain.indexes import VectorstoreIndexCreator
from langchain.llms import OpenAI, Cohere, HuggingFaceHub
from langchain.chat_models import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.prompts.chat import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
)
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.text_splitter import CharacterTextSplitter
from langchain.utilities import GoogleSerperAPIWrapper, WikipediaAPIWrapper

import yaml
from yaml.loader import SafeLoader

CONFIG = {}
with open('config.yaml') as file:
    CONFIG = yaml.load(file, Loader=SafeLoader)

STORE = None

def __store__():

    global STORE
    if STORE is None:
        
        loader = PyPDFLoader(os.path.join(os.path.dirname(__file__), "../docs/data.pdf"))

        splitter = CharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=10,
            separator=" ",
        )

        embeddings = OpenAIEmbeddings()

        STORE = Chroma.from_documents(
            documents=splitter.split_documents(loader.load()),
            embeddings=embeddings,
            persist_directory=os.path.join(os.environ['PERSIST_MOUNT_PATH'], "./chroma"),
        )
        
        print('Stored.')

def __llm__():
    if CONFIG['sources']['selected'] == 'cohere':
        return Cohere(
            model_name="cohere/gpt3-small",
            temperature=0,
        )
    else:
        return ChatOpenAI(
            model_name="gpt-3.5-turbo",
            temperature=0,
        ) 

def __org_data_prompt__():

    if CONFIG['models']['selected'] == 'cohere':
        return PromptTemplate(
            template="""Question: {question}
            Answer: If you don't know the answer, just say that "I don't know", don't try to make up an answer.
            """,
            input_variables=["question"],
        )
    else:
        system_template = """Use the following pieces of context to answer the users question.
        Take note of the sources and include them in the answer in the format: "SOURCES: source1 source2", use "SOURCES" in capital letters regardless of the number of sources.
        If you don't know the answer, just say that "I don't know", don't try to make up an answer.
        ----------------
        {summaries}"""
        messages = [
            SystemMessagePromptTemplate.from_template(system_template),
            HumanMessagePromptTemplate.from_template("{question}")
        ]
        return ChatPromptTemplate.from_messages(messages)

def __org_data_chain__():

    prompt_template = """Use the following pieces of context to answer the users question.
    Take note of the sources and include them in the answer in the format: "SOURCES: source1 source2", use "SOURCES" in capital letters regardless of the number of sources.
    If you don't know the answer, just say that "I don't know", don't try to make up an answer.
    ----------------
    {context}
    
    Question: {question}"""

    prompt = PromptTemplate(
        template=prompt_template, 
        input_variables=["context", "question"],
    )

    return RetrievalQA.from_chain_type(
        llm=__llm__(),
        chain_type="stuff",
        retriever=STORE.as_retriever(),
        chain_type_kwargs={"prompt": prompt},
    )

def __org_data_chain_with_source__():
    
    return RetrievalQAWithSourcesChain.from_chain_type(
        llm=__llm__(),
        chain_type="stuff",
        retriever=STORE.as_retriever(),
        return_source_documents=True,
        chain_type_kwargs={"prompt": __org_data_prompt__()},
    )

def __openai_prompt__():
    return PromptTemplate(
        template="{query}",
        input_variables=["query"],
    )

def __openai_chain__():
    return LLMChain(
        llm=__llm__(),
        prompt=__openai_prompt__(),
    )

def answer_via_chain(question):
    
    __store__()

    chain = __org_data_chain_with_source__()

    return chain(question)

def answer_via_agent(question):

    __store__()

    llm = __llm__()

    llm_chain = SimpleSequentialChain(
        chains=[__org_data_chain__(), __openai_chain__()],
        verbose=True,
    )

    llm_tool = Tool(
        name='Language Model',
        func=llm_chain.run,
        description='Useful for general purpose queries and logic.'
    )


    docstore = DocstoreExplorer(Wikipedia())

    tools = [
        llm_tool,
    ]

    if 'math' in CONFIG['tools']['selected']:
        tools.append(
            Tool(
                name='Calculator',
                func=LLMMathChain(llm=llm).run,
                description='Useful for when you need to do simple math.'
            )
        )

    if 'google' in CONFIG['tools']['selected']:
        tools.append(
            Tool(
                name='Google',
                func=GoogleSerperAPIWrapper().run,
                description='Useful for when you need to ask with search.'
            )
        )

    if 'wikipedia' in CONFIG['tools']['selected']:
        tools.append(
            Tool(
                name='Wikipedia',
                func=WikipediaAPIWrapper().run,
                description='Useful for when you need to lookup information from Wikipedia.'
            )
        )

    agent = initialize_agent(
        agent='zero-shot-react-description',
        tools=tools,
        llm=llm,
        verbose=True,
        max_iterations=8,
    )

    return agent(question)