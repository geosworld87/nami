import Foundation
import Combine

class AuthViewModel: ObservableObject {
    @Published var email: String = ""
    @Published var password: String = ""
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    @Published var isAuthenticated: Bool = false
    @Published var currentUser: User?

    private let authService: AuthServiceProtocol
    private var cancellables = Set<AnyCancellable>()

    init(authService: AuthServiceProtocol) {
        self.authService = authService
        setupObservers()
    }

    func login() async {
        isLoading = true
        errorMessage = nil

        do {
            let user = try await authService.login(email: email, password: password)
            await MainActor.run {
                self.currentUser = user
                self.isAuthenticated = true
                self.isLoading = false
                self.password = "" // Clear password
            }
        } catch {
            await MainActor.run {
                self.errorMessage = "Login failed: \(error.localizedDescription)"
                self.isLoading = false
            }
            Logger.shared.log("Login error: \(error)", level: .error)
        }
    }

    func logout() async {
        do {
            try await authService.logout()
            await MainActor.run {
                self.currentUser = nil
                self.isAuthenticated = false
                self.email = ""
                self.password = ""
            }
        } catch {
            await MainActor.run {
                self.errorMessage = "Logout failed: \(error.localizedDescription)"
            }
            Logger.shared.log("Logout error: \(error)", level: .error)
        }
    }

    private func setupObservers() {
        // Subscribe to login notifications
        NotificationCenter.default.publisher(for: .userDidLogin)
            .sink { [weak self] notification in
                if let user = notification.userInfo?["user"] as? User {
                    self?.currentUser = user
                    self?.isAuthenticated = true
                    Logger.shared.log("User logged in via notification: \(user.email)", level: .info)
                }
            }
            .store(in: &cancellables)

        // Subscribe to logout notifications
        NotificationCenter.default.publisher(for: .userDidLogout)
            .sink { [weak self] _ in
                self?.currentUser = nil
                self?.isAuthenticated = false
                Logger.shared.log("User logged out via notification", level: .info)
            }
            .store(in: &cancellables)

        // Validate email in real-time
        $email
            .debounce(for: .milliseconds(500), scheduler: DispatchQueue.main)
            .sink { [weak self] email in
                if !email.isEmpty && !email.contains("@") {
                    self?.errorMessage = "Invalid email format"
                } else {
                    self?.errorMessage = nil
                }
            }
            .store(in: &cancellables)
    }
}
