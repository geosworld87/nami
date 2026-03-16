import Foundation

// CIRCULAR DEPENDENCY - References UserService
class CacheService {
    private var userCache: [String: User] = [:]
    private var postCache: [String: Post] = [:]
    private var userListCache: [User]?
    private let cacheExpiration: TimeInterval = 300 // 5 minutes

    // CIRCULAR DEPENDENCY - CacheService holds reference to UserService
    weak var userService: UserService?

    private var userCacheTimestamp: Date?
    private var postCacheTimestamp: Date?

    init() {}

    // User caching
    func cacheUser(_ user: User) {
        userCache[user.id] = user
        Logger.shared.log("Cached user: \(user.id)", level: .debug)
    }

    func cacheUsers(_ users: [User]) {
        userListCache = users
        userCacheTimestamp = Date()
        for user in users {
            userCache[user.id] = user
        }
        Logger.shared.log("Cached \(users.count) users", level: .debug)
    }

    func getCachedUser(id: String) -> User? {
        return userCache[id]
    }

    func getCachedUsers() -> [User]? {
        guard let timestamp = userCacheTimestamp,
              Date().timeIntervalSince(timestamp) < cacheExpiration else {
            return nil
        }
        return userListCache
    }

    func invalidateUser(id: String) {
        userCache.removeValue(forKey: id)
        userListCache = nil
        Logger.shared.log("Invalidated user cache: \(id)", level: .debug)

        // CIRCULAR DEPENDENCY - Calling back to UserService
        Task {
            try? await userService?.fetchById(id)
        }
    }

    func invalidateUsers() {
        userCache.removeAll()
        userListCache = nil
        userCacheTimestamp = nil
        Logger.shared.log("Invalidated all user cache", level: .debug)
    }

    // Post caching
    func cachePost(_ post: Post) {
        postCache[post.id] = post
        Logger.shared.log("Cached post: \(post.id)", level: .debug)
    }

    func getCachedPost(id: String) -> Post? {
        return postCache[id]
    }

    func invalidatePost(id: String) {
        postCache.removeValue(forKey: id)
        Logger.shared.log("Invalidated post cache: \(id)", level: .debug)
    }

    func invalidatePosts() {
        postCache.removeAll()
        postCacheTimestamp = nil
        Logger.shared.log("Invalidated all post cache", level: .debug)
    }

    func clearAll() {
        invalidateUsers()
        invalidatePosts()
        Logger.shared.log("Cleared all cache", level: .info)
    }

    func getCacheSize() -> Int {
        return userCache.count + postCache.count
    }
}
