import Foundation

class AuthService: AuthServiceProtocol {
    private let networkManager: NetworkManager
    weak var delegate: AuthServiceDelegate?

    private(set) var isAuthenticated: Bool = false
    private var currentToken: String?

    init(networkManager: NetworkManager) {
        self.networkManager = networkManager
    }

    func login(email: String, password: String) async throws -> User {
        let loginRequest = ["email": email, "password": password]
        let body = try JSONEncoder().encode(loginRequest)

        struct LoginResponse: Codable {
            let user: User
            let token: String
            let refreshToken: String
        }

        let response: LoginResponse = try await networkManager.performRequest(
            endpoint: APIEndpoint.auth.path,
            method: "POST",
            body: body
        )

        currentToken = response.token
        isAuthenticated = true

        // Post notification
        NotificationCenter.default.post(
            name: .userDidLogin,
            object: self,
            userInfo: ["user": response.user]
        )

        // Notify delegate
        delegate?.authServiceDidLogin(self, user: response.user)

        Logger.shared.log("User logged in: \(response.user.email)", level: .info)

        return response.user
    }

    func logout() async throws {
        currentToken = nil
        isAuthenticated = false

        // Post notification
        NotificationCenter.default.post(
            name: .userDidLogout,
            object: self
        )

        // Notify delegate
        delegate?.authServiceDidLogout(self)

        Logger.shared.log("User logged out", level: .info)
    }

    func refreshToken() async throws -> String {
        struct RefreshResponse: Codable {
            let token: String
        }

        let response: RefreshResponse = try await networkManager.performRequest(
            endpoint: "/auth/refresh",
            method: "POST",
            headers: ["Authorization": "Bearer \(currentToken ?? "")"]
        )

        currentToken = response.token
        Logger.shared.log("Token refreshed", level: .info)

        return response.token
    }
}
