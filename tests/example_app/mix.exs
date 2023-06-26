defmodule Example.MixProject do
  use Mix.Project

  def application do
    [
      mod: {Example.Application, []},
      extra_applications: [:logger, :runtime_tools]
    ]
  end

  def project do
    [
      app: :example,
      version: "0.1.0",
      elixir: "~> 1.14",
      elixirc_paths: elixirc_paths(Mix.env()),
      start_permanent: Mix.env() == :prod,
      deps: [
        {:phoenix, "~> 1.7.2"},
        {:jason, "~> 1.2"},
        {:plug_cowboy, "~> 2.5"}
      ]
    ]
  end

  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_), do: ["lib"]
end
