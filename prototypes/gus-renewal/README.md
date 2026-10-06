# Gus renewal prototype

Clickable, single-file prototype of Gus acting inside Slack on benefits renewal data.
Open `index.html` in a browser (no build step). All names, rates and counts are synthetic.

Flow:
1. Gus opens with the renewal -> "Show me" -> compare renewing UHC (+28%) vs. advisor BCBS TX package (-15%) -> confirm.
2. Use the suggested prompt ("where am I at with my renewal?") -> status + open enrollment breakdown -> "Yes, nudge them" opens a group DM with the people who haven't finished.

Persona defaults are synthetic. Override at view time with URL params (nothing real is committed): `index.html?company=Acme%20Inc&admin=Pat&full=Pat%20Lee`. Rates and employees are constants at the top of the `<script>` block.
