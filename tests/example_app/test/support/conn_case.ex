defmodule ExampleWeb.ConnCase do
  use ExUnit.CaseTemplate

  using do
    quote do
      @endpoint ExampleWeb.Endpoint

      use ExampleWeb, :verified_routes

      import Plug.Conn
      import Phoenix.ConnTest
      import ExampleWeb.ConnCase
    end
  end

  setup _tags do
    {:ok, conn: Phoenix.ConnTest.build_conn()}
  end
end
