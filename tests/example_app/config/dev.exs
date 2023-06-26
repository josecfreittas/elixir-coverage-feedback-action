import Config

config :example, ExampleWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4000],
  check_origin: false,
  code_reloader: true,
  debug_errors: true,
  secret_key_base: "TSaoGLNYjYLIK+/wnxOs8/oKqiAhe+PBXkuPBuTf4bMeh4WcV705w7VzCrer+CH8",
  watchers: []

config :phoenix, :stacktrace_depth, 20
config :phoenix, :plug_init_mode, :runtime
