# TODO — Creative Finance page

- [ ] Replace generic pillar descriptions with real session details once confirmed
- [ ] Add popular/recognizable names (speakers, investors, brand partners) once confirmed —
      only add names that are 100% confirmed to avoid false claims
- [ ] Confirm /register vs /sponsorship are the right CTA destinations for pitchers vs investors
- [x] Add page to nav/footer once content is finalized

# TODO — Before launch

- [ ] Swap Paystack account from personal to ACS's own account:
      - Update PAYSTACK_SECRET_KEY in Render (test key first, then live key at launch)
      - Re-register the webhook URL on ACS's own Paystack dashboard
        (Settings -> API Keys & Webhooks -> https://abuja-creative-showcase.onrender.com/payments/webhook)
      - Webhook URLs must be set separately for Test Mode and Live Mode