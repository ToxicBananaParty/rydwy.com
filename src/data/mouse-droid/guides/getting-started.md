Welcome. Here's the shortest path from a fresh install to a droid that's narrating your
day. There are three things to set up, and then you're done.

### 1. Grant Accessibility

Mouse Droid reads **window titles** — the app you're in, its title, and the time. That's
it. To do that it needs the macOS **Accessibility** permission. It is *not* Screen
Recording and *not* input monitoring; there's no keylogging and no screenshots, ever.

macOS won't let an app grant this to itself, so you grant it by hand: open **System
Settings → Privacy & Security → Accessibility** and switch Mouse Droid on. The app shows
you the live status on its onboarding screen, so you'll see it flip to granted once macOS
catches up.

### 2. Point him at an LLM

Every summary, report, and chat reply comes from a large language model, so Mouse Droid
needs one to talk to. Open **Settings** and choose one of two ways to connect:

- **LiteLLM** — point him at a LiteLLM endpoint by setting the **base URL**, **API key**,
  and **model**. This is the default path and works with any model LiteLLM can reach.
- **Claude CLI (subscription)** — if you'd rather use your Claude subscription, enable the
  Claude CLI option instead. Run `claude setup-token` in a terminal to get an OAuth token,
  paste it into Settings, and (if `claude` isn't on your PATH) set the binary path.
  Changing the token or path needs an app restart to take effect.

You can fine-tune which model or effort level each feature uses, but the defaults are a
fine place to start.

### 3. Connect your Memory Palace

The Memory Palace is where your narrated day is stored — it's a local **Obsidian Memory
service** that you install and run separately (it isn't bundled with the app). Once it's
running, set its URL in **Settings** (the default is `http://127.0.0.1:8790/mcp`). Settings
shows a health indicator so you know when the app can reach it.

With those three in place, your day starts flowing into the vault — sessions, summaries,
and provenance included.

### Optional: sharper browser context

Out of the box, browser activity is captured from window titles like everything else. If
you want the exact page URL, you can opt specific browsers into **enhanced URL capture** in
Settings — each one asks for macOS Automation permission the first time. It's entirely
optional and off until you turn it on.

That's it — give him a few minutes and check the **Timeline** tab.
