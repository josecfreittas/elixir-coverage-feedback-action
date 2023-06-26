defmodule ExampleWeb.Router do
  use ExampleWeb, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  scope "/", ExampleWeb do
    pipe_through :browser
    get "/", IndexController, :index
  end
end

defmodule ExampleWeb.IndexController do
  use ExampleWeb, :controller

  def index(conn, _params) do
    html(conn, "<h1>Hello World!</h1>")
  end
end
