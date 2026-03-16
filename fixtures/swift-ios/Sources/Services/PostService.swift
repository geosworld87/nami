import Foundation

class PostService: DataServiceProtocol {
    typealias T = Post

    private let networkManager: NetworkManager

    init(networkManager: NetworkManager) {
        self.networkManager = networkManager
    }

    func fetchAll() async throws -> [Post] {
        let posts: [Post] = try await networkManager.performRequest(
            endpoint: APIEndpoint.posts.path,
            method: "GET"
        )

        Logger.shared.log("Fetched \(posts.count) posts", level: .info)

        NotificationCenter.default.post(
            name: .dataDidUpdate,
            object: self,
            userInfo: ["type": "posts"]
        )

        return posts
    }

    func fetchById(_ id: String) async throws -> Post? {
        let post: Post = try await networkManager.performRequest(
            endpoint: APIEndpoint.posts.path + "/\(id)",
            method: "GET"
        )

        Logger.shared.log("Fetched post: \(post.title)", level: .info)
        return post
    }

    func create(_ item: Post) async throws -> Post {
        let body = try JSONEncoder().encode(item)

        let post: Post = try await networkManager.performRequest(
            endpoint: APIEndpoint.posts.path,
            method: "POST",
            body: body
        )

        Logger.shared.log("Created post: \(post.title)", level: .info)

        NotificationCenter.default.post(
            name: .dataDidUpdate,
            object: self,
            userInfo: ["type": "posts", "action": "create"]
        )

        return post
    }

    func delete(_ id: String) async throws {
        struct EmptyResponse: Codable {}

        let _: EmptyResponse = try await networkManager.performRequest(
            endpoint: APIEndpoint.posts.path + "/\(id)",
            method: "DELETE"
        )

        Logger.shared.log("Deleted post: \(id)", level: .info)

        NotificationCenter.default.post(
            name: .dataDidUpdate,
            object: self,
            userInfo: ["type": "posts", "action": "delete", "id": id]
        )
    }

    func fetchPostsByAuthor(_ authorId: String) async throws -> [Post] {
        let posts: [Post] = try await networkManager.performRequest(
            endpoint: APIEndpoint.posts.path,
            method: "GET",
            queryParams: ["authorId": authorId]
        )

        Logger.shared.log("Fetched \(posts.count) posts for author: \(authorId)", level: .info)
        return posts
    }
}
