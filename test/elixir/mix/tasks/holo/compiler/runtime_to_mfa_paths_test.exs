defmodule Mix.Tasks.Holo.Compiler.RuntimeToMfaPathsTest do
  use Hologram.Test.BasicCase, async: true

  import ExUnit.CaptureIO

  alias Mix.Tasks.Holo.Compiler.RuntimeToMfaPaths, as: Task

  test "run/1" do
    output = capture_io(fn -> Task.run(["{Enum, :into_protocol, 2}"]) end)

    expected =
      normalize_newlines("""
      {Enum, :into, 2} -> {Enum, :into_protocol, 2}
      [{Enum, :into, 2}, {Enum, :into_protocol, 2}]
      """)

    assert String.contains?(output, expected)
  end

  test "doesn't print paths to MFAs excluded from the shared runtime" do
    output = capture_io(fn -> Task.run(["{String.Chars, :to_string, 1}"]) end)

    assert output == ""
  end
end
