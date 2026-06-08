# /oidc

OpenID Connect login flow. Two routes: `GET /oidc` initiates
login (or kicks off logout when `?action=logout`), `GET /oidc/callback`
finalises the round-trip after the IdP redirects back.

Unlike the rest of the API, this slice keeps native Passport routing
instead of `defineAction`; the request/response model is a chain of
Passport middlewares that own the `(req, res, next)` triple and end with
`res.redirect(...)`, which doesn't fit the JSON-returning handler
contract. The slice is mounted only when OIDC is enabled and sits before
the JWT auth barrier in the main router.
