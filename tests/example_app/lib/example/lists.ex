defmodule Example.Lists do
  def add_to_head(list, element), do: [element | list]
  def add_to_tail(list, element), do: Enum.concat(list, [element])
  def remove_from_head([]), do: []
  def remove_from_head(list), do: tl(list)
  def remove_from_tail(list), do: Enum.drop(list, -1)
end
