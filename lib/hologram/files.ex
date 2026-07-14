defmodule Hologram.Files do
  @moduledoc """
  Client-side helpers for files selected through Hologram file events.
  """

  @doc """
  Deletes a registered client-side file token.

  Returns `true` when a file was removed and `false` when the token was already absent.
  """
  @spec delete(String.t()) :: boolean()
  def delete(_token), do: __server_pass_through__()

  @doc """
  Uploads a registered file token to `url`.

  The request body is the browser `File`. The method defaults to `POST`; pass `method: "PUT"` or
  another HTTP method to override it. The file MIME type is sent as `Content-Type` unless
  `headers` already contains a content-type header. Successfully uploaded files are removed from
  the registry unless `cleanup: false` is passed.
  """
  @spec upload(String.t(), String.t(), keyword()) :: any()
  def upload(token, url, opts \\ [])

  def upload(_token, _url, _opts), do: __server_pass_through__()

  defp __server_pass_through__ do
    Application.get_env(:hologram, :__server_pass_through__, :ok)
  end
end
