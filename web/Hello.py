import streamlit as st
import streamlit_authenticator as stauth
from poetry_demo import answer_brain_chain, answer_brain_agent
import yaml
from yaml.loader import SafeLoader
with open('staff.yaml') as file:
    config = yaml.load(file, Loader=SafeLoader)

authenticator = stauth.Authenticate(
    config['credentials'],
    config['cookie']['name'],
    config['cookie']['key'],
    config['cookie']['expiry_days'],
)

name, authentication_status, username = authenticator.login('Login', 'main')

st.title("Hey Docq")

if authentication_status is False:
    st.error("You are not authenticated")
elif authentication_status is None:
    st.warning("Please login")
else:

    config_file = 'config.yaml'
    config = {}
    with open(config_file) as file:
        config = yaml.load(file, Loader=SafeLoader)

    authenticator.logout('Logout', 'main')

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