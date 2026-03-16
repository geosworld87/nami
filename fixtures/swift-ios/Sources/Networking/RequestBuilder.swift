import Foundation

class RequestBuilder {
    private var url: URL?
    private var method: String = "GET"
    private var headers: [String: String] = [:]
    private var body: Data?
    private var timeout: TimeInterval = 30

    func setURL(_ url: URL) -> RequestBuilder {
        self.url = url
        return self
    }

    func setMethod(_ method: String) -> RequestBuilder {
        self.method = method
        return self
    }

    func addHeader(key: String, value: String) -> RequestBuilder {
        headers[key] = value
        return self
    }

    func setHeaders(_ headers: [String: String]) -> RequestBuilder {
        self.headers = headers
        return self
    }

    func setBody(_ body: Data) -> RequestBuilder {
        self.body = body
        return self
    }

    func setBody<T: Encodable>(_ encodable: T) throws -> RequestBuilder {
        let encoder = JSONEncoder()
        self.body = try encoder.encode(encodable)
        return self
    }

    func setTimeout(_ timeout: TimeInterval) -> RequestBuilder {
        self.timeout = timeout
        return self
    }

    func build() throws -> URLRequest {
        guard let url = url else {
            throw NetworkError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.timeoutInterval = timeout

        for (key, value) in headers {
            request.setValue(value, forHTTPHeaderField: key)
        }

        if let body = body {
            request.httpBody = body
            if request.value(forHTTPHeaderField: "Content-Type") == nil {
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            }
        }

        return request
    }
}
