import Config

config :example, ExampleWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "DpTrfqG8/CeeG5zU2NAwk7+v/InIhG1gfBT/fUXpnin0w1VD1UcdFXeUeXHW72cM",
  server: false

config :phoenix, :plug_init_mode, :runtime
