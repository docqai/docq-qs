import time
import streamlit as st
import streamlit_authenticator as stauth
import yaml
from yaml.loader import SafeLoader, FullLoader

access_files = {'admin': 'admin.yaml', 'staff': 'staff.yaml'}
access = {}

for (k, v) in access_files.items():
    with open(v) as file:
        access[k] = yaml.load(file, Loader=SafeLoader)

authenticator = stauth.Authenticate(
    access['admin']['credentials'],
    access['admin']['cookie']['name'],
    access['admin']['cookie']['key'],
    access['admin']['cookie']['expiry_days'],
)

name, authentication_status, username = authenticator.login('Login', 'main')

st.title("Docq Admin")

if authentication_status is False:
    st.error("You are not authenticated")
elif authentication_status is None:
    st.warning("Please login")
else:

    config_file = 'config.yaml'
    config = {}
    with open(config_file) as file:
        config = yaml.load(file, Loader=FullLoader)

    authenticator.logout('Logout', 'main')
    tab_sources, tab_settings, tab_access = st.tabs(["Data Sources", "Model/Tools Settings", "Access Control"])

    sources = {}
    for (k, v) in config['sources']['all'].items():
        tab_sources.subheader(k)
        for (kk, vv) in v.items():
            sources[kk] = tab_sources.checkbox(vv, key=kk, value=kk in config['sources']['selected'])

    def save_sources():
        config['sources']['selected'] = [k for (k, v) in sources.items() if v]
        yaml.dump(config, open(config_file, 'w'))
        success = tab_sources.success("Saved.")
        time.sleep(3)
        success.empty()

    tab_sources.button("Save Data Sources", key="save_sources", on_click=save_sources)

    tab_settings_col_model, tab_settings_col_turbo = tab_settings.columns(2)

    tab_settings_col_model.subheader("Model Selection")

    current_hosting = 'Public' if config['models']['selected'] in config['models']['all']['Public'].keys() else 'Private'

    hosting = tab_settings_col_model.radio("Hosting", list(config['models']['all'].keys()), key="hosting", index=list(config['models']['all'].keys()).index(current_hosting))
    tab_settings_col_model.divider()

    model_public, model_private = None, None
    if hosting == 'Public':
        keys = list(config['models']['all']['Public'].keys())
        if config['models']['selected'] in keys:
            model_public = tab_settings_col_model.selectbox("Available Models", keys, key="model", index=keys.index(config['models']['selected']))
        else:
            model_public = tab_settings_col_model.selectbox("Available Models", keys, key="model")
    elif hosting == 'Private':
        keys = list(config['models']['all']['Private'].keys())
        if config['models']['selected'] in keys:
            model_private = tab_settings_col_model.selectbox("Available Models", keys, key="model", index=keys.index(config['models']['selected']))
        else:
            model_private = tab_settings_col_model.selectbox("Available Models", keys, key="model")

    tab_settings_col_turbo.subheader("Turbo Mode & Tools")

    turbo_on = tab_settings_col_turbo.checkbox("Enable Turbo Mode", key="turbo", value=config['tools']['enabled'])

    tools = {}
    if turbo_on:
        tab_settings_col_turbo.divider()
        for (k, v) in config['tools']['all'].items():
            tools[k] = tab_settings_col_turbo.checkbox(v, key=k, value=k in config['tools']['selected'])

    def save_settings():
        
        if model_public:
            config['models']['selected'] = model_public
        elif model_private:
            config['models']['selected'] = model_private
        
        config['tools']['enabled'] = turbo_on

        if turbo_on:
            config['tools']['selected'] = [k for (k, v) in tools.items() if v]
        else:
            config['tools']['selected'] = []

        yaml.dump(config, open(config_file, 'w'))
        success = tab_settings.success("Saved")
        time.sleep(3)
        success.empty()

   
    tab_settings.button("Save Settings", key="save_settings", on_click=save_settings)

    tab_access_admin, tab_access_staff = tab_access.columns(2)

    tab_access_staff.subheader("Staff Access")

    for (k, v) in access['staff']['credentials']['usernames'].items():
        tab_access_staff.write(f' - {k}: [{v["name"]}](mailto:{v["email"]})')

    tab_access_admin.subheader("Admin Access")

    for (k, v) in access['admin']['credentials']['usernames'].items():
        tab_access_admin.write(f' - {k}: [{v["name"]}](mailto:{v["email"]})')