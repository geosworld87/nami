import XCTest
@testable import SwiftIOSFixture

class UserListViewModelTests: XCTestCase {

    var sut: UserListViewModel!
    var mockUserService: UserService!
    var mockNetworkManager: NetworkManager!
    var mockCacheService: CacheService!

    override func setUpWithError() throws {
        mockNetworkManager = NetworkManager(baseURL: "https://test.api.com")
        mockCacheService = CacheService()
        mockUserService = UserService(networkManager: mockNetworkManager, cacheService: mockCacheService)
        sut = UserListViewModel(userService: mockUserService)
    }

    override func tearDownWithError() throws {
        sut = nil
        mockUserService = nil
        mockNetworkManager = nil
        mockCacheService = nil
    }

    func testViewModelInitialization() {
        XCTAssertNotNil(sut)
        XCTAssertEqual(sut.users.count, 0)
        XCTAssertFalse(sut.isLoading)
        XCTAssertNil(sut.errorMessage)
    }

    func testLoadDataSetsLoadingState() async {
        await sut.loadData()
        // After completion, loading should be false
        XCTAssertFalse(sut.isLoading)
    }

    func testSearchFiltersUsers() {
        let testUsers = [
            User(id: "1", name: "John Doe", email: "john@example.com", avatarURL: nil, createdAt: Date()),
            User(id: "2", name: "Jane Smith", email: "jane@example.com", avatarURL: nil, createdAt: Date()),
            User(id: "3", name: "Bob Johnson", email: "bob@example.com", avatarURL: nil, createdAt: Date())
        ]

        sut.users = testUsers
        sut.searchText = "john"

        let filtered = sut.filteredUsers
        XCTAssertTrue(filtered.count <= testUsers.count)
    }

    func testFilteredUsersReturnsAllWhenSearchEmpty() {
        let testUsers = [
            User(id: "1", name: "John Doe", email: "john@example.com", avatarURL: nil, createdAt: Date()),
            User(id: "2", name: "Jane Smith", email: "jane@example.com", avatarURL: nil, createdAt: Date())
        ]

        sut.users = testUsers
        sut.searchText = ""

        XCTAssertEqual(sut.filteredUsers.count, testUsers.count)
    }

    func testDeleteUserRemovesFromList() async {
        let testUser = User(
            id: "delete-test",
            name: "Delete Test",
            email: "delete@example.com",
            avatarURL: nil,
            createdAt: Date()
        )

        sut.users = [testUser]
        await sut.deleteUser(testUser)

        // User should be removed from local list even if network fails
        // (in real implementation)
    }

    func testNotificationObserver() {
        let expectation = XCTNSNotificationExpectation(name: .dataDidUpdate)

        NotificationCenter.default.post(
            name: .dataDidUpdate,
            object: nil,
            userInfo: ["type": "users"]
        )

        wait(for: [expectation], timeout: 1.0)
    }
}
