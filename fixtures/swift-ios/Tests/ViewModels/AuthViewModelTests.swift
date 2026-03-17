import XCTest
import Combine
@testable import SwiftIOSFixture

class AuthViewModelTests: XCTestCase {

    var sut: AuthViewModel!
    var mockAuthService: AuthService!
    var mockNetworkManager: NetworkManager!
    var cancellables = Set<AnyCancellable>()

    override func setUpWithError() throws {
        mockNetworkManager = NetworkManager(baseURL: "https://test.api.com")
        mockAuthService = AuthService(networkManager: mockNetworkManager)
        sut = AuthViewModel(authService: mockAuthService)
    }

    override func tearDownWithError() throws {
        sut = nil
        mockAuthService = nil
        mockNetworkManager = nil
        cancellables.removeAll()
    }

    func testViewModelInitialization() {
        XCTAssertNotNil(sut)
        XCTAssertEqual(sut.email, "")
        XCTAssertEqual(sut.password, "")
        XCTAssertFalse(sut.isLoading)
        XCTAssertFalse(sut.isAuthenticated)
        XCTAssertNil(sut.currentUser)
    }

    func testLoginSetsLoadingState() async {
        sut.email = "test@example.com"
        sut.password = "password123"
        await sut.login()
        XCTAssertFalse(sut.isLoading)
    }

    func testLogoutClearsState() async {
        sut.isAuthenticated = true
        sut.email = "test@example.com"
        await sut.logout()
        XCTAssertFalse(sut.isAuthenticated)
    }

    func testLoginNotificationUpdatesState() {
        let expectation = expectation(description: "Auth state updated")

        sut.$isAuthenticated
            .dropFirst()
            .sink { isAuth in
                if isAuth {
                    expectation.fulfill()
                }
            }
            .store(in: &cancellables)

        let testUser = User(
            id: "1",
            name: "Test User",
            email: "test@example.com",
            avatarURL: nil,
            createdAt: Date()
        )

        NotificationCenter.default.post(
            name: .userDidLogin,
            object: nil,
            userInfo: ["user": testUser]
        )

        wait(for: [expectation], timeout: 2.0)
    }

    func testLogoutNotificationClearsState() {
        sut.isAuthenticated = true

        let expectation = expectation(description: "Auth state cleared")

        sut.$isAuthenticated
            .dropFirst()
            .sink { isAuth in
                if !isAuth {
                    expectation.fulfill()
                }
            }
            .store(in: &cancellables)

        NotificationCenter.default.post(
            name: .userDidLogout,
            object: nil
        )

        wait(for: [expectation], timeout: 2.0)
    }

    func testEmailValidation() {
        let expectation = expectation(description: "Email validated")

        sut.$errorMessage
            .dropFirst()
            .sink { error in
                if error == "Invalid email format" {
                    expectation.fulfill()
                }
            }
            .store(in: &cancellables)

        sut.email = "invalid-email"

        wait(for: [expectation], timeout: 2.0)
    }
}
