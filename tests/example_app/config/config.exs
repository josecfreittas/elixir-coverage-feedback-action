import Config

config :example,
  generators: [binary_id: true]

config :example, ExampleWeb.Endpoint,
  url: [host: "localhost"],
  render_errors: [
    formats: [json: ExampleWeb.ErrorJSON],
    layout: false
  ]

config :logger, :console,
  format: "$time [$level] $message | $metadata\n",
  metadata: [:request_id]

config :logger, level: :info

config :phoenix, :json_library, Jason

import_config "#{config_env()}.exs"
