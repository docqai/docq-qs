import streamlit as st
from source import init_envs, load_config

init_envs()

config = load_config()

st.title("Hey Docq")

st.subheader("Let's chat (coming soon)")
st.caption(f'Current model: {config["models"]["selected"]}')

st.button('New chat +')

with st.container():
    tabs = st.tabs(["Email Writing Assistant", "Daily Schedule", "Random Fact"])
    for i, t in enumerate(tabs):
        t.text_area('History', label_visibility='hidden', key=f'history{i}')
        t.text_input("Chat", label_visibility='hidden', key=f'chat{i}')
        t.divider()
        col_search, col_archive = t.columns(2)
        col_search.button('Search', key=f'search{i}')
        col_archive.button('Archive', key=f'archive{i}')
