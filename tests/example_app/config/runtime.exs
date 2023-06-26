import Config

if System.get_env("PHX_SERVER") do
  config :example, ExampleWeb.Endpoint, server: true
end
