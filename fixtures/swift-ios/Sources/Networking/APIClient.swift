import Foundation

class APIClient {
    private let networkManager: NetworkManager

    init(networkManager: NetworkManager = NetworkManager()) {
        self.networkManager = networkManager
    }

    func request<T: Codable>(
        _ endpoint: APIEndpoint,
        method: String = "GET",
        body: Encodable? = nil,
        headers: [String: String]? = nil
    ) async throws -> T {
        var requestBody: Data?

        if let body = body {
            requestBody = try JSONEncoder().encode(body)
        }

        return try await networkManager.performRequest(
            endpoint: endpoint.path,
            method: method,
            headers: headers,
            body: requestBody
        )
    }

    func get<T: Codable>(_ endpoint: APIEndpoint, headers: [String: String]? = nil) async throws -> T {
        return try await request(endpoint, method: "GET", headers: headers)
    }

    func post<T: Codable, B: Encodable>(
        _ endpoint: APIEndpoint,
        body: B,
        headers: [String: String]? = nil
    ) async throws -> T {
        return try await request(endpoint, method: "POST", body: body, headers: headers)
    }

    func put<T: Codable, B: Encodable>(
        _ endpoint: APIEndpoint,
        body: B,
        headers: [String: String]? = nil
    ) async throws -> T {
        return try await request(endpoint, method: "PUT", body: body, headers: headers)
    }

    func delete<T: Codable>(_ endpoint: APIEndpoint, headers: [String: String]? = nil) async throws -> T {
        return try await request(endpoint, method: "DELETE", headers: headers)
    }
}
