defmodule Example.Application do
  use Application

  @impl true
  def start(_type, _args) do
    opts = [strategy: :one_for_one, name: Example.Supervisor]
    Supervisor.start_link([ExampleWeb.Endpoint], opts)
  end
end
