defmodule Example.StringsTest do
  use ExUnit.Case
  alias Example.Strings

  describe "reverse_string/1" do
    test "correctly reverses a non-empty string" do
      assert Strings.reverse_string("elixir") == "rixile"
    end

    test "returns an empty string when given an empty string" do
      assert Strings.reverse_string("") == ""
    end
  end

  describe "uppercase_string/1" do
    test "correctly converts a non-empty string to uppercase" do
      assert Strings.uppercase_string("elixir") == "ELIXIR"
    end

    test "returns an empty string when given an empty string" do
      assert Strings.uppercase_string("") == ""
    end

    test "returns the same string when given an already uppercased string" do
      assert Strings.uppercase_string("ELIXIR") == "ELIXIR"
    end
  end

  describe "lowercase_string/1" do
    test "correctly converts a non-empty string to lowercase" do
      assert Strings.lowercase_string("ELIXIR") == "elixir"
    end

    test "returns an empty string when given an empty string" do
      assert Strings.lowercase_string("") == ""
    end

    test "returns the same string when given an already lowercased string" do
      assert Strings.lowercase_string("elixir") == "elixir"
    end
  end

  describe "concatenate_strings/2" do
    test "correctly concatenates two non-empty strings" do
      assert Strings.concatenate_strings("elixir", " is fun") == "elixir is fun"
    end

    test "returns the first string when the second string is empty" do
      assert Strings.concatenate_strings("elixir", "") == "elixir"
    end

    test "returns the second string when the first string is empty" do
      assert Strings.concatenate_strings("", " is fun") == " is fun"
    end

    test "returns an empty string when both strings are empty" do
      assert Strings.concatenate_strings("", "") == ""
    end
  end
end
