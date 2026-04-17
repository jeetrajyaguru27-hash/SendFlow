import streamlit as st
import pandas as pd
import requests

def dashboard_component(api_base_url="http://localhost:8000"):
    """Analytics dashboard component."""
    st.title("📊 Analytics Dashboard")

    headers = {'Authorization': f'Bearer {st.session_state.token}'}

    # Get dashboard data
    response = requests.get(f"{api_base_url}/analytics/dashboard", headers=headers)

    if response.status_code == 200:
        data = response.json()

        if data['campaigns']:
            # Overall stats
            total_campaigns = len(data['campaigns'])
            total_leads = sum(c['stats']['total_leads'] for c in data['campaigns'])
            total_sent = sum(c['stats']['sent'] for c in data['campaigns'])
            total_read = sum(c['stats']['read'] for c in data['campaigns'])
            total_clicked = sum(c['stats']['clicked'] for c in data['campaigns'])

            st.subheader("📈 Overall Performance")

            col1, col2, col3, col4, col5 = st.columns(5)
            col1.metric("Campaigns", total_campaigns)
            col2.metric("Total Leads", total_leads)
            col3.metric("Emails Sent", total_sent)
            col4.metric("Opens", total_read)
            col5.metric("Clicks", total_clicked)

            # Campaign details
            st.subheader("Campaign Details")

            for campaign in data['campaigns']:
                with st.expander(f"📧 {campaign['campaign_name']} - {campaign['status'].title()}"):
                    stats = campaign['stats']

                    if stats['total_leads'] > 0:
                        # Progress metrics
                        col1, col2, col3 = st.columns(3)

                        with col1:
                            sent_pct = (stats['sent'] / stats['total_leads']) * 100
                            st.metric("Sent Rate", f"{stats['sent']}/{stats['total_leads']}", f"{sent_pct:.1f}%")
                            st.progress(sent_pct / 100)

                        with col2:
                            read_pct = (stats['read'] / stats['sent']) * 100 if stats['sent'] > 0 else 0
                            st.metric("Open Rate", f"{stats['read']}/{stats['sent']}", f"{read_pct:.1f}%")
                            st.progress(read_pct / 100)

                        with col3:
                            click_pct = (stats['clicked'] / stats['sent']) * 100 if stats['sent'] > 0 else 0
                            st.metric("Click Rate", f"{stats['clicked']}/{stats['sent']}", f"{click_pct:.1f}%")
                            st.progress(click_pct / 100)

                        # Bounce and reply rates
                        col1, col2 = st.columns(2)
                        with col1:
                            bounce_pct = (stats['bounced'] / stats['sent']) * 100 if stats['sent'] > 0 else 0
                            st.metric("Bounce Rate", f"{stats['bounced']}", f"{bounce_pct:.1f}%")

                        with col2:
                            reply_pct = (stats['replied'] / stats['sent']) * 100 if stats['sent'] > 0 else 0
                            st.metric("Reply Rate", f"{stats['replied']}", f"{reply_pct:.1f}%")

                    # Lead details button
                    if st.button(f"View Lead Details for {campaign['campaign_name']}", key=f"details_{campaign['campaign_id']}"):
                        show_lead_details(api_base_url, campaign['campaign_id'], headers)

        else:
            st.info("No campaigns found. Create your first campaign to see analytics!")
    else:
        st.error("Failed to load dashboard data.")

def show_lead_details(api_base_url, campaign_id, headers):
    """Show detailed lead information for a campaign."""
    st.subheader("Lead Details")

    response = requests.get(f"{api_base_url}/analytics/campaign/{campaign_id}/leads", headers=headers)

    if response.status_code == 200:
        leads = response.json()

        if leads:
            # Convert to DataFrame
            df = pd.DataFrame(leads)

            # Format timestamps
            timestamp_cols = ['sent_at', 'read_at', 'clicked_at', 'bounced_at', 'replied_at']
            for col in timestamp_cols:
                if col in df.columns:
                    df[col] = pd.to_datetime(df[col], errors='coerce').dt.strftime('%Y-%m-%d %H:%M')

            # Status color coding
            def color_status(val):
                color_map = {
                    'pending': 'gray',
                    'sent': 'blue',
                    'read': 'green',
                    'clicked': 'orange',
                    'bounced': 'red',
                    'replied': 'purple'
                }
                color = color_map.get(val, 'black')
                return f'color: {color}'

            # Display with styling
            st.dataframe(df.style.applymap(color_status, subset=['status']))

            # Export option
            csv = df.to_csv(index=False)
            st.download_button(
                label="📥 Download as CSV",
                data=csv,
                file_name=f"campaign_{campaign_id}_leads.csv",
                mime="text/csv"
            )
        else:
            st.info("No leads found for this campaign.")
    else:
        st.error("Failed to load lead details.")