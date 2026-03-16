import Foundation

protocol AuthServiceProtocol {
    func login(email: String, password: String) async throws -> User
    func logout() async throws
    func refreshToken() async throws -> String
    var isAuthenticated: Bool { get }
}

protocol AuthServiceDelegate: AnyObject {
    func authServiceDidLogin(_ service: AuthServiceProtocol, user: User)
    func authServiceDidLogout(_ service: AuthServiceProtocol)
    func authServiceDidFailWithError(_ service: AuthServiceProtocol, error: Error)
}
