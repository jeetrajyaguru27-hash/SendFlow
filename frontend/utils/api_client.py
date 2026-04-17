import requests
import streamlit as st

class APIClient:
    """API client for backend communication."""

    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url

    def _get_headers(self):
        """Get headers with authentication."""
        headers = {'Content-Type': 'application/json'}
        if st.session_state.token:
            headers['Authorization'] = f'Bearer {st.session_state.token}'
        return headers

    def _handle_response(self, response):
        """Handle API response and authentication errors."""
        if response.status_code == 401:
            st.error("Authentication failed. Please login again.")
            st.session_state.token = None
            st.session_state.user = None
            st.rerun()
            return None
        return response

    def get(self, endpoint):
        """GET request."""
        try:
            response = requests.get(
                f"{self.base_url}{endpoint}",
                headers=self._get_headers()
            )
            return self._handle_response(response)
        except requests.exceptions.RequestException as e:
            st.error(f"Connection error: {str(e)}")
            return None

    def post(self, endpoint, data=None, files=None):
        """POST request."""
        try:
            headers = self._get_headers()
            if files:
                # Remove Content-Type for file uploads
                headers.pop('Content-Type', None)

            response = requests.post(
                f"{self.base_url}{endpoint}",
                headers=headers,
                json=data,
                files=files
            )
            return self._handle_response(response)
        except requests.exceptions.RequestException as e:
            st.error(f"Connection error: {str(e)}")
            return None

    def delete(self, endpoint):
        """DELETE request."""
        try:
            response = requests.delete(
                f"{self.base_url}{endpoint}",
                headers=self._get_headers()
            )
            return self._handle_response(response)
        except requests.exceptions.RequestException as e:
            st.error(f"Connection error: {str(e)}")
            return None

# Global API client instance
api_client = APIClient()