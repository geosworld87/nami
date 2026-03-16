import Foundation
import Combine

// GOD CLASS - Manages too many responsibilities
class AppState: ObservableObject {
    static let shared = AppState()

    // Authentication State
    @Published var isAuthenticated: Bool = false
    @Published var currentUser: User?
    @Published var authToken: String?
    @Published var refreshToken: String?
    @Published var tokenExpiresAt: Date?

    // User Data
    @Published var users: [User] = []
    @Published var posts: [Post] = []
    @Published var selectedUserId: String?
    @Published var selectedPostId: String?

    // App Settings
    @Published var isDarkMode: Bool = false
    @Published var fontSize: CGFloat = 14.0
    @Published var notificationsEnabled: Bool = true
    @Published var analyticsEnabled: Bool = true
    @Published var language: String = "en"

    // Network State
    @Published var isOnline: Bool = true
    @Published var lastSyncDate: Date?
    @Published var pendingSyncCount: Int = 0

    // Cache Management
    @Published var cacheSize: Int64 = 0
    @Published var maxCacheSize: Int64 = 100_000_000
    @Published var shouldClearCacheOnLogout: Bool = true

    // Feature Flags
    @Published var experimentalFeaturesEnabled: Bool = false
    @Published var betaUIEnabled: Bool = false
    @Published var advancedLoggingEnabled: Bool = false

    // UI State
    @Published var selectedTab: Int = 0
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    @Published var showingAlert: Bool = false

    private var cancellables = Set<AnyCancellable>()

    private init() {
        setupObservers()
    }

    func login(user: User, token: String, refreshToken: String) {
        self.currentUser = user
        self.authToken = token
        self.refreshToken = refreshToken
        self.isAuthenticated = true
        self.tokenExpiresAt = Date().addingTimeInterval(3600)
        saveAuthState()
        scheduleTokenRefresh()
    }

    func logout() {
        self.currentUser = nil
        self.authToken = nil
        self.refreshToken = nil
        self.isAuthenticated = false
        self.tokenExpiresAt = nil
        self.users = []
        self.posts = []
        if shouldClearCacheOnLogout {
            clearCache()
        }
        clearAuthState()
    }

    func updateUser(_ user: User) {
        if let index = users.firstIndex(where: { $0.id == user.id }) {
            users[index] = user
        }
        if currentUser?.id == user.id {
            currentUser = user
        }
    }

    func addPost(_ post: Post) {
        posts.insert(post, at: 0)
        pendingSyncCount += 1
    }

    func deletePost(_ postId: String) {
        posts.removeAll { $0.id == postId }
    }

    func updateSettings(darkMode: Bool? = nil, fontSize: CGFloat? = nil, notifications: Bool? = nil) {
        if let darkMode = darkMode {
            self.isDarkMode = darkMode
        }
        if let fontSize = fontSize {
            self.fontSize = fontSize
        }
        if let notifications = notifications {
            self.notificationsEnabled = notifications
        }
        saveSettings()
    }

    func syncData() async {
        isLoading = true
        // Simulate network sync
        do {
            try await Task.sleep(nanoseconds: 1_000_000_000)
            lastSyncDate = Date()
            pendingSyncCount = 0
            isLoading = false
        } catch {
            errorMessage = "Sync failed: \(error.localizedDescription)"
            isLoading = false
        }
    }

    func clearCache() {
        cacheSize = 0
        users = []
        posts = []
    }

    func calculateCacheSize() -> Int64 {
        let userSize = Int64(users.count * 1024)
        let postSize = Int64(posts.count * 2048)
        cacheSize = userSize + postSize
        return cacheSize
    }

    func enableExperimentalFeatures() {
        experimentalFeaturesEnabled = true
        betaUIEnabled = true
        advancedLoggingEnabled = true
    }

    func disableExperimentalFeatures() {
        experimentalFeaturesEnabled = false
        betaUIEnabled = false
        advancedLoggingEnabled = false
    }

    func selectUser(_ userId: String) {
        selectedUserId = userId
        selectedTab = 0
    }

    func selectPost(_ postId: String) {
        selectedPostId = postId
        selectedTab = 1
    }

    private func setupObservers() {
        $isOnline
            .sink { [weak self] online in
                if online {
                    Task {
                        await self?.syncData()
                    }
                }
            }
            .store(in: &cancellables)
    }

    private func saveAuthState() {
        UserDefaults.standard.set(authToken, forKey: "authToken")
        UserDefaults.standard.set(refreshToken, forKey: "refreshToken")
    }

    private func clearAuthState() {
        UserDefaults.standard.removeObject(forKey: "authToken")
        UserDefaults.standard.removeObject(forKey: "refreshToken")
    }

    private func saveSettings() {
        UserDefaults.standard.set(isDarkMode, forKey: "isDarkMode")
        UserDefaults.standard.set(fontSize, forKey: "fontSize")
        UserDefaults.standard.set(notificationsEnabled, forKey: "notificationsEnabled")
    }

    private func scheduleTokenRefresh() {
        // Token refresh logic
    }
}
