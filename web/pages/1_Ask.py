import streamlit as st
from source import answer_brain_chain, answer_brain_agent
import yaml
from yaml.loader import SafeLoader

st.title("Hey Docq")

config_file = 'config.yaml'
config = {}
with open(config_file) as file:
    config = yaml.load(file, Loader=SafeLoader)


st.subheader("Ask me anything")

mode = 'Simple'
if config["tools"]["enabled"]:
    mode = st.radio("Mode", ("Simple", "Turbo"))
    st.caption(f'Current model: {config["models"]["selected"]} | tools: {", ".join(config["tools"]["selected"])}')
else:
    st.caption(f'Current model: {config["models"]["selected"]}')


question = st.text_input("Type your question", placeholder="Ask anything about your organisation ...")

if question:
    if mode == 'Simple':
        answer = answer_brain_chain(question)
        st.subheader("Answer")
        st.write(answer['answer'])
        st.subheader('Sources')
        st.write(answer['sources'])
        # st.subheader('All relevant sources')
        # st.write(' '.join(list(set([doc.metadata['source'] for doc in answer['source_documents']]))))

    else:
        st.subheader("Turbo-charged Answer")
        st.write(answer_brain_agent(question)['output'])