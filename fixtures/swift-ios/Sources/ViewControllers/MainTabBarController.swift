import UIKit

// HIGH COUPLING - Directly instantiates concrete services instead of using protocols
class MainTabBarController: UITabBarController {

    // Concrete dependencies - not using protocols!
    private let networkManager = NetworkManager()
    private let authService: AuthService
    private let userService: UserService
    private let postService: PostService
    private let cacheService = CacheService()

    override init(nibName nibNameOrNil: String?, bundle nibBundleOrNil: Bundle?) {
        // HIGH COUPLING - Creating all dependencies here
        self.authService = AuthService(networkManager: networkManager)
        self.userService = UserService(networkManager: networkManager, cacheService: cacheService)
        self.postService = PostService(networkManager: networkManager)

        // Set circular dependency
        cacheService.userService = userService

        super.init(nibName: nibNameOrNil, bundle: nibBundleOrNil)

        setupObservers()
    }

    required init?(coder: NSCoder) {
        // HIGH COUPLING - Creating all dependencies here
        self.authService = AuthService(networkManager: networkManager)
        self.userService = UserService(networkManager: networkManager, cacheService: cacheService)
        self.postService = PostService(networkManager: networkManager)

        // Set circular dependency
        cacheService.userService = userService

        super.init(coder: coder)

        setupObservers()
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        setupViewControllers()
        setupAppearance()
    }

    private func setupViewControllers() {
        let usersVC = UIViewController()
        usersVC.title = "Users"
        usersVC.tabBarItem = UITabBarItem(
            title: "Users",
            image: UIImage(systemName: "person.2"),
            selectedImage: UIImage(systemName: "person.2.fill")
        )

        let postsVC = UIViewController()
        postsVC.title = "Posts"
        postsVC.tabBarItem = UITabBarItem(
            title: "Posts",
            image: UIImage(systemName: "doc.text"),
            selectedImage: UIImage(systemName: "doc.text.fill")
        )

        let profileVC = ProfileViewController()
        profileVC.delegate = self
        profileVC.title = "Profile"
        profileVC.tabBarItem = UITabBarItem(
            title: "Profile",
            image: UIImage(systemName: "person.circle"),
            selectedImage: UIImage(systemName: "person.circle.fill")
        )

        let usersNav = UINavigationController(rootViewController: usersVC)
        let postsNav = UINavigationController(rootViewController: postsVC)
        let profileNav = UINavigationController(rootViewController: profileVC)

        viewControllers = [usersNav, postsNav, profileNav]
    }

    private func setupAppearance() {
        tabBar.tintColor = .systemBlue
        tabBar.backgroundColor = .systemBackground
    }

    private func setupObservers() {
        // Observe login notifications
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleUserLogin),
            name: .userDidLogin,
            object: nil
        )

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleUserLogout),
            name: .userDidLogout,
            object: nil
        )
    }

    @objc private func handleUserLogin(_ notification: Notification) {
        if let user = notification.userInfo?["user"] as? User {
            Logger.shared.log("User logged in: \(user.email)", level: .info)
            // Update UI
            selectedIndex = 0
        }
    }

    @objc private func handleUserLogout(_ notification: Notification) {
        Logger.shared.log("User logged out", level: .info)
        // Clear cache
        cacheService.clearAll()
        // Show login screen
        presentLoginScreen()
    }

    private func presentLoginScreen() {
        // Present login view controller
        Logger.shared.log("Presenting login screen", level: .debug)
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }
}

// MARK: - ProfileViewControllerDelegate
extension MainTabBarController: ProfileViewControllerDelegate {
    func profileViewControllerDidRequestLogout(_ controller: ProfileViewController) {
        Task {
            try? await authService.logout()
        }
    }

    func profileViewController(_ controller: ProfileViewController, didUpdateUser user: User) {
        Logger.shared.log("User updated: \(user.email)", level: .info)
    }
}
