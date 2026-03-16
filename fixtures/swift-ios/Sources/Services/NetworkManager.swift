import Foundation

enum NetworkError: Error {
    case invalidURL
    case invalidResponse
    case httpError(statusCode: Int)
    case decodingError
    case noData
}

class NetworkManager {
    private let session: URLSession
    private let baseURL: String

    init(baseURL: String = Constants.apiBaseURL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    // LONG METHOD - Intentional code smell (50+ lines)
    func performRequest<T: Codable>(
        endpoint: String,
        method: String = "GET",
        headers: [String: String]? = nil,
        body: Data? = nil,
        queryParams: [String: String]? = nil
    ) async throws -> T {
        // Construct URL
        guard var urlComponents = URLComponents(string: baseURL + endpoint) else {
            Logger.shared.log("Invalid URL: \(baseURL + endpoint)", level: .error)
            throw NetworkError.invalidURL
        }

        // Add query parameters
        if let queryParams = queryParams {
            var queryItems: [URLQueryItem] = []
            for (key, value) in queryParams {
                queryItems.append(URLQueryItem(name: key, value: value))
            }
            urlComponents.queryItems = queryItems
        }

        guard let url = urlComponents.url else {
            Logger.shared.log("Failed to construct URL", level: .error)
            throw NetworkError.invalidURL
        }

        // Create request
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.timeoutInterval = 30

        // Add default headers
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        // Add custom headers
        if let headers = headers {
            for (key, value) in headers {
                request.setValue(value, forHTTPHeaderField: key)
            }
        }

        // Add body
        if let body = body {
            request.httpBody = body
        }

        // Log request
        Logger.shared.log("Request: \(method) \(url)", level: .info)
        if let headers = headers {
            Logger.shared.log("Headers: \(headers)", level: .debug)
        }

        // Perform request
        let (data, response) = try await session.data(for: request)

        // Validate response
        guard let httpResponse = response as? HTTPURLResponse else {
            Logger.shared.log("Invalid response type", level: .error)
            throw NetworkError.invalidResponse
        }

        // Log response
        Logger.shared.log("Response: \(httpResponse.statusCode)", level: .info)

        // Check status code
        guard (200...299).contains(httpResponse.statusCode) else {
            Logger.shared.log("HTTP error: \(httpResponse.statusCode)", level: .error)
            throw NetworkError.httpError(statusCode: httpResponse.statusCode)
        }

        // Decode response
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601

        do {
            let decodedData = try decoder.decode(T.self, from: data)
            Logger.shared.log("Successfully decoded response", level: .debug)
            return decodedData
        } catch {
            Logger.shared.log("Decoding error: \(error)", level: .error)
            if let json = String(data: data, encoding: .utf8) {
                Logger.shared.log("Response data: \(json)", level: .debug)
            }
            throw NetworkError.decodingError
        }
    }
}
