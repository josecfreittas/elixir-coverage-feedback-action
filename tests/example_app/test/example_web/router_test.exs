defmodule ExampleWeb.RouterTest do
  use ExampleWeb.ConnCase

  test "GET /" do
    conn = build_conn()
    conn = get(conn, "/")
    assert html_response(conn, 200) =~ "<h1>Hello World!</h1>"
  end

  test "GET /api returns 404 for unhandled route" do
    conn = build_conn()
    conn = get(conn, "/api")
    assert response(conn, 404)
  end

  test "GET /nonexistent returns 404 for non-existent route" do
    conn = build_conn()
    conn = get(conn, "/nonexistent")
    assert response(conn, 404)
  end

  if Application.compile_env(:example, :dev_routes) do
    test "GET /dev/dashboard" do
      conn = build_conn()
      conn = get(conn, "/dev/dashboard")
      assert html_response(conn, 200)
    end
  end
end
