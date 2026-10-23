export class ApiError extends Error {
  constructor(message, {
    kind,
    status = null,
    code = null,
    details = null,
    url = null,
    cause,
  } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.details = details;
    this.url = url;
  }
}

function validateBaseUrl(baseUrl) {
  if (typeof baseUrl !== "string" || baseUrl.trim() === "") {
    throw new TypeError("baseUrl должен быть непустой строкой.");
  }

  let url;
  try {
    url = new URL(baseUrl);
  } catch (cause) {
    throw new TypeError("baseUrl должен быть абсолютным URL.", { cause });
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new TypeError("baseUrl должен использовать http или https.");
  }

  if (url.search !== "" || url.hash !== "") {
    throw new TypeError("baseUrl не должен содержать query или hash.");
  }

  return url;
}

function normalizeBaseUrl(baseUrl) {
  const url = validateBaseUrl(baseUrl);
  url.pathname = url.pathname.replace(/\/+$/, "");
  const result = url.toString();
  return result.endsWith("/") ? result.slice(0, -1) : result;
}

function validateTimeoutMs(value, name = "timeoutMs") {
  if (!Number.isInteger(value) || value <= 0) {
    throw new TypeError(`${name} должен быть положительным целым числом.`);
  }
  return value;
}

function isAbortSignal(value) {
  return Boolean(
    value
    && typeof value === "object"
    && typeof value.aborted === "boolean"
    && typeof value.addEventListener === "function",
  );
}

function isResponse(value) {
  return Boolean(
    value
    && typeof value === "object"
    && typeof value.ok === "boolean"
    && typeof value.status === "number"
    && value.headers
    && typeof value.headers.get === "function"
    && typeof value.json === "function",
  );
}

// Создаёт URL относительно baseUrl и добавляет непустые параметры query.
// Значения кодируются средствами URL и URLSearchParams, а не вручную.
export function buildUrl(baseUrl, path, query = {}) {
  const url = validateBaseUrl(baseUrl);

  if (typeof path !== "string" || path.trim() === "") {
    throw new TypeError("path должен быть непустой строкой.");
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) {
    throw new TypeError("path должен быть относительным путём.");
  }

  if (query === null || typeof query !== "object" || Array.isArray(query)) {
    throw new TypeError("query должен быть обычным объектом.");
  }

  const basePath = url.pathname.replace(/\/+$/, "");
  const relativePath = path.replace(/^\/+/, "");
  url.pathname = `${basePath}/${relativePath}`;

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    url.searchParams.append(key, String(value));
  }

  return url.toString();
}

export function createApiClient({
  baseUrl,
  fetchFn = globalThis.fetch,
  timeoutMs = 2000,
} = {}) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  if (typeof fetchFn !== "function") {
    throw new TypeError("fetchFn должен быть функцией.");
  }

  const defaultTimeoutMs = validateTimeoutMs(timeoutMs);

  async function requestJson(path, options = {}) {
    const { query, signal, timeoutMs: requestTimeoutMs } = options ?? {};

    const effectiveTimeoutMs = requestTimeoutMs === undefined
      ? defaultTimeoutMs
      : validateTimeoutMs(requestTimeoutMs);

    if (signal !== undefined && !isAbortSignal(signal)) {
      throw new TypeError("signal должен быть AbortSignal.");
    }

    const url = buildUrl(normalizedBaseUrl, path, query);
    const timeoutSignal = AbortSignal.timeout(effectiveTimeoutMs);
    const combinedSignal = signal === undefined
      ? timeoutSignal
      : AbortSignal.any([signal, timeoutSignal]);

    let response;
    try {
      response = await fetchFn(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: combinedSignal,
      });
    } catch (cause) {
      let kind = "network";
      let message = "Не удалось выполнить сетевой запрос.";
      if (signal?.aborted) {
        kind = "aborted";
        message = "Запрос отменён.";
      } else if (timeoutSignal.aborted) {
        kind = "timeout";
        message = "Превышено время ожидания запроса.";
      }
      throw new ApiError(message, { kind, url, cause });
    }

    if (!isResponse(response)) {
      throw new ApiError("fetchFn вернул не Response.", {
        kind: "invalid-response",
        url,
      });
    }

    if (!response.ok) {
      let payload = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      const errorPayload = payload
        && typeof payload === "object"
        && payload.error
        && typeof payload.error === "object"
        ? payload.error
        : null;

      const code = errorPayload && typeof errorPayload.code === "string"
        ? errorPayload.code
        : null;

      const details = errorPayload && "details" in errorPayload
        ? errorPayload.details
        : null;

      const message = errorPayload
        && typeof errorPayload.message === "string"
        && errorPayload.message.trim() !== ""
        ? errorPayload.message
        : `HTTP ${response.status}`;

      throw new ApiError(message, {
        kind: "http",
        status: response.status,
        code,
        details,
        url,
      });
    }

    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("json")) {
      throw new ApiError("Ожидался ответ с JSON Content-Type.", {
        kind: "invalid-response",
        url,
      });
    }

    try {
      return await response.json();
    } catch (cause) {
      throw new ApiError("Не удалось разобрать JSON ответа.", {
        kind: "invalid-response",
        url,
        cause,
      });
    }
  }

  return { requestJson };
}