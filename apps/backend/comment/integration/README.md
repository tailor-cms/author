# Comment integrations

Lets something other than a person post into a repository's discussion:
Tailor's own built-in integrations, which announce things like a
publish, and external ones - a CI pipeline, an alerting tool, a
translation vendor - posting over a webhook.

## How it works

**Registering one hands out a credential, not an invitation.** An
integration holds a name, an icon and a hashed token, and nothing about
where it posts.

**A thread chooses what it hears.** Each thread keeps a list of sources
it subscribes to - event types, or `integration:<key>`. A post goes to
every thread that asked for that source.

**Posts arrive Slack-compatible.** Anything that already posts to Slack
works unchanged, attachments included.
