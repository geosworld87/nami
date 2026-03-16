import Foundation

struct Constants {
    // API Configuration
    static let apiBaseURL = "https://api.example.com/v1"
    static let apiTimeout: TimeInterval = 30.0

    // App Configuration
    static let appName = "MyApp"
    static let appVersion = "1.0.0"
    static let buildNumber = "1"

    // Cache Configuration
    static let maxCacheSize: Int64 = 100_000_000 // 100 MB
    static let cacheExpirationTime: TimeInterval = 300 // 5 minutes

    // Feature Flags
    static let enableAnalytics = true
    static let enableCrashReporting = true
    static let enableExperimentalFeatures = false

    // UI Configuration
    static let defaultAnimationDuration: TimeInterval = 0.3
    static let defaultCornerRadius: CGFloat = 8.0

    // Pagination
    static let defaultPageSize = 20
    static let maxPageSize = 100

    // Validation
    static let minPasswordLength = 8
    static let maxPasswordLength = 128
}
