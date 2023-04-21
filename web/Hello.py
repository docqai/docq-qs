import streamlit as st
from poetry_demo import answer_brain_chain, answer_brain_agent

st.title("Hey Docq")

st.subheader("Ask me anything")

mode = st.radio("Mode", ("Simple", "Turbo"))

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