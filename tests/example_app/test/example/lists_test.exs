defmodule Example.ListsTest do
  use ExUnit.Case
  alias Example.Lists

  describe "add_to_head/2" do
    test "adds an element to the head of a non-empty list" do
      assert Lists.add_to_head([1, 2, 3], 0) == [0, 1, 2, 3]
    end

    test "adds an element to an empty list" do
      assert Lists.add_to_head([], 1) == [1]
    end
  end

  describe "add_to_tail/2" do
    test "adds an element to the tail of a non-empty list" do
      assert Lists.add_to_tail([1, 2, 3], 4) == [1, 2, 3, 4]
    end

    test "adds an element to an empty list" do
      assert Lists.add_to_tail([], 1) == [1]
    end
  end

  describe "remove_from_head/1" do
    test "removes an element from the head of a non-empty list" do
      assert Lists.remove_from_head([1, 2, 3]) == [2, 3]
    end

    test "returns an empty list when given an empty list" do
      assert Lists.remove_from_head([]) == []
    end
  end

  describe "remove_from_tail/1" do
    test "removes an element from the tail of a non-empty list" do
      assert Lists.remove_from_tail([1, 2, 3]) == [1, 2]
    end

    test "returns an empty list when given an empty list" do
      assert Lists.remove_from_tail([]) == []
    end
  end
end
