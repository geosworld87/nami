import Foundation
import Combine

class UserListViewModel: ViewModelProtocol {
    @Published var users: [User] = []
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    @Published var searchText: String = ""

    private let userService: any DataServiceProtocol
    private var cancellables = Set<AnyCancellable>()

    var filteredUsers: [User] {
        if searchText.isEmpty {
            return users
        }
        return users.filter { user in
            user.name.localizedCaseInsensitiveContains(searchText) ||
            user.email.localizedCaseInsensitiveContains(searchText)
        }
    }

    init<T: DataServiceProtocol>(userService: T) where T.T == User {
        self.userService = userService
        setupObservers()
    }

    func loadData() async {
        isLoading = true
        errorMessage = nil

        do {
            let fetchedUsers = try await userService.fetchAll()
            await MainActor.run {
                self.users = fetchedUsers
                self.isLoading = false
            }
        } catch {
            await MainActor.run {
                self.errorMessage = "Failed to load users: \(error.localizedDescription)"
                self.isLoading = false
            }
            Logger.shared.log("Error loading users: \(error)", level: .error)
        }
    }

    func refreshUsers() async {
        await loadData()
    }

    func deleteUser(_ user: User) async {
        do {
            try await userService.delete(user.id)
            await MainActor.run {
                self.users.removeAll { $0.id == user.id }
            }
        } catch {
            await MainActor.run {
                self.errorMessage = "Failed to delete user: \(error.localizedDescription)"
            }
            Logger.shared.log("Error deleting user: \(error)", level: .error)
        }
    }

    private func setupObservers() {
        NotificationCenter.default.publisher(for: .dataDidUpdate)
            .sink { [weak self] notification in
                if let type = notification.userInfo?["type"] as? String, type == "users" {
                    Task {
                        await self?.loadData()
                    }
                }
            }
            .store(in: &cancellables)
    }
}
