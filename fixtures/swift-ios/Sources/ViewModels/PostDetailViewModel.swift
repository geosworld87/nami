import Foundation
import Combine

class PostDetailViewModel: ViewModelProtocol {
    @Published var post: Post?
    @Published var author: User?
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?

    private let postId: String
    private let postService: any DataServiceProtocol
    private var cancellables = Set<AnyCancellable>()

    init<T: DataServiceProtocol>(postId: String, postService: T) where T.T == Post {
        self.postId = postId
        self.postService = postService
        setupObservers()
    }

    func loadData() async {
        isLoading = true
        errorMessage = nil

        do {
            let fetchedPost = try await postService.fetchById(postId)
            await MainActor.run {
                self.post = fetchedPost
                self.isLoading = false
            }

            if let post = fetchedPost {
                await loadAuthor(authorId: post.authorId)
            }
        } catch {
            await MainActor.run {
                self.errorMessage = "Failed to load post: \(error.localizedDescription)"
                self.isLoading = false
            }
            Logger.shared.log("Error loading post: \(error)", level: .error)
        }
    }

    func deletePost() async {
        guard let post = post else { return }

        do {
            try await postService.delete(post.id)
            Logger.shared.log("Post deleted: \(post.id)", level: .info)
        } catch {
            await MainActor.run {
                self.errorMessage = "Failed to delete post: \(error.localizedDescription)"
            }
            Logger.shared.log("Error deleting post: \(error)", level: .error)
        }
    }

    private func loadAuthor(authorId: String) async {
        // This would normally use a UserService
        Logger.shared.log("Loading author: \(authorId)", level: .debug)
    }

    private func setupObservers() {
        NotificationCenter.default.publisher(for: .dataDidUpdate)
            .sink { [weak self] notification in
                guard let self = self else { return }
                if let type = notification.userInfo?["type"] as? String,
                   type == "posts",
                   let action = notification.userInfo?["action"] as? String,
                   action == "delete",
                   let id = notification.userInfo?["id"] as? String,
                   id == self.postId {
                    Task {
                        await MainActor.run {
                            self.post = nil
                        }
                    }
                }
            }
            .store(in: &cancellables)
    }
}
