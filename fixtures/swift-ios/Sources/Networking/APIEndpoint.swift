import Foundation

enum APIEndpoint {
    case users
    case user(id: String)
    case posts
    case post(id: String)
    case auth
    case refreshToken

    var path: String {
        switch self {
        case .users:
            return "/users"
        case .user(let id):
            return "/users/\(id)"
        case .posts:
            return "/posts"
        case .post(let id):
            return "/posts/\(id)"
        case .auth:
            return "/auth/login"
        case .refreshToken:
            return "/auth/refresh"
        }
    }
}
