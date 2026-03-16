import Foundation

class UserService: DataServiceProtocol {
    typealias T = User

    private let networkManager: NetworkManager
    private let cacheService: CacheService

    init(networkManager: NetworkManager, cacheService: CacheService) {
        self.networkManager = networkManager
        self.cacheService = cacheService
    }

    func fetchAll() async throws -> [User] {
        // Check cache first
        if let cachedUsers = cacheService.getCachedUsers() {
            Logger.shared.log("Returning cached users", level: .debug)
            return cachedUsers
        }

        let users: [User] = try await networkManager.performRequest(
            endpoint: APIEndpoint.users.path,
            method: "GET"
        )

        // Cache the result
        cacheService.cacheUsers(users)

        Logger.shared.log("Fetched \(users.count) users", level: .info)
        return users
    }

    func fetchById(_ id: String) async throws -> User? {
        // Check cache first
        if let cachedUser = cacheService.getCachedUser(id: id) {
            Logger.shared.log("Returning cached user: \(id)", level: .debug)
            return cachedUser
        }

        let user: User = try await networkManager.performRequest(
            endpoint: APIEndpoint.users.path + "/\(id)",
            method: "GET"
        )

        // Cache the result
        cacheService.cacheUser(user)

        Logger.shared.log("Fetched user: \(user.email)", level: .info)
        return user
    }

    func create(_ item: User) async throws -> User {
        let body = try JSONEncoder().encode(item)

        let user: User = try await networkManager.performRequest(
            endpoint: APIEndpoint.users.path,
            method: "POST",
            body: body
        )

        // Invalidate cache
        cacheService.invalidateUsers()

        Logger.shared.log("Created user: \(user.email)", level: .info)
        return user
    }

    func delete(_ id: String) async throws {
        struct EmptyResponse: Codable {}

        let _: EmptyResponse = try await networkManager.performRequest(
            endpoint: APIEndpoint.users.path + "/\(id)",
            method: "DELETE"
        )

        // Invalidate cache
        cacheService.invalidateUser(id: id)

        Logger.shared.log("Deleted user: \(id)", level: .info)
    }
}
