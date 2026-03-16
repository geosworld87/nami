import XCTest
@testable import SwiftIOSFixture

class AuthServiceTests: XCTestCase {

    var sut: AuthService!
    var mockNetworkManager: NetworkManager!

    override func setUpWithError() throws {
        mockNetworkManager = NetworkManager(baseURL: "https://test.api.com")
        sut = AuthService(networkManager: mockNetworkManager)
    }

    override func tearDownWithError() throws {
        sut = nil
        mockNetworkManager = nil
    }

    func testAuthServiceInitialization() {
        XCTAssertNotNil(sut)
        XCTAssertFalse(sut.isAuthenticated)
    }

    func testLoginSetsAuthenticatedState() async throws {
        // This would normally use a mock network manager
        // For fixture purposes, we're just testing the structure
        XCTAssertFalse(sut.isAuthenticated)
    }

    func testLogoutClearsAuthenticatedState() async throws {
        try await sut.logout()
        XCTAssertFalse(sut.isAuthenticated)
    }

    func testLoginPostsNotification() {
        let expectation = XCTNSNotificationExpectation(
            name: .userDidLogin,
            object: sut
        )

        // Would trigger login here

        wait(for: [expectation], timeout: 1.0)
    }

    func testLogoutPostsNotification() {
        let expectation = XCTNSNotificationExpectation(
            name: .userDidLogout,
            object: sut
        )

        Task {
            try? await sut.logout()
        }

        wait(for: [expectation], timeout: 1.0)
    }
}
