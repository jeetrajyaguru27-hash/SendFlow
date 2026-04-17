import streamlit as st
import requests

def login_component(api_base_url="http://localhost:8000"):
    """Handle user authentication."""
    st.title("📧 Email Automation Platform")
    st.subheader("Login with Google")

    if st.button("🔐 Login with Gmail", type="primary"):
        try:
            response = requests.get(f"{api_base_url}/auth/login")
            if response.status_code == 200:
                auth_data = response.json()
                auth_url = auth_data['authorization_url']

                st.markdown(f"[Click here to login with Google]({auth_url})")
                st.info("Complete the login in your browser, then paste the authorization code below.")

                auth_code = st.text_input("Authorization Code:")
                if st.button("Complete Login") and auth_code:
                    callback_response = requests.get(
                        f"{api_base_url}/auth/callback",
                        params={"code": auth_code, "state": "streamlit"}
                    )

                    if callback_response.status_code == 200:
                        token_data = callback_response.json()
                        st.session_state.token = token_data['access_token']
                        st.session_state.user = token_data['user']
                        st.success("Login successful!")
                        st.rerun()
                    else:
                        st.error("Login failed. Please check your authorization code.")
            else:
                st.error("Failed to initialize login. Check backend connection.")
        except requests.exceptions.RequestException as e:
            st.error(f"Connection error: {str(e)}")

def logout_component():
    """Handle user logout."""
    if st.button("🚪 Logout"):
        st.session_state.token = None
        st.session_state.user = None
        st.rerun()