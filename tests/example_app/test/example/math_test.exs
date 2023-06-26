defmodule Example.MathTest do
  use ExUnit.Case
  alias Example.Math

  doctest Example.Math

  describe "sum/2" do
    test "adds two positive numbers correctly" do
      assert Math.sum(2, 3) == 5
    end

    test "adds two negative numbers correctly" do
      assert Math.sum(-2, -3) == -5
    end

    test "adds a positive and a negative number correctly" do
      assert Math.sum(5, -3) == 2
    end
  end

  describe "multiply/2" do
    test "multiplies two positive numbers correctly" do
      assert Math.multiply(2, 3) == 6
    end

    test "multiplies two negative numbers correctly" do
      assert Math.multiply(-2, -3) == 6
    end

    test "multiplies a positive and a negative number correctly" do
      assert Math.multiply(5, -3) == -15
    end
  end

  describe "divide/2" do
    test "divides two positive numbers correctly" do
      assert Math.divide(6, 3) == 2
    end

    test "divides two negative numbers correctly" do
      assert Math.divide(-6, -3) == 2
    end

    test "divides a positive and a negative number correctly" do
      assert Math.divide(6, -3) == -2
    end

    test "raises ArithmeticError when dividing by zero" do
      assert_raise ArithmeticError, fn -> Math.divide(5, 0) end
    end
  end

  describe "subtract/2" do
    test "subtracts two positive numbers correctly" do
      assert Math.subtract(5, 3) == 2
    end

    test "subtracts two negative numbers correctly" do
      assert Math.subtract(-5, -3) == -2
    end

    test "subtracts a positive and a negative number correctly" do
      assert Math.subtract(5, -3) == 8
    end
  end
end
