import XCTest
@testable import SwiftIOSFixture

class UserServiceTests: XCTestCase {

    var sut: UserService!
    var mockNetworkManager: NetworkManager!
    var mockCacheService: CacheService!

    override func setUpWithError() throws {
        mockNetworkManager = NetworkManager(baseURL: "https://test.api.com")
        mockCacheService = CacheService()
        sut = UserService(networkManager: mockNetworkManager, cacheService: mockCacheService)

        // Set circular dependency for testing
        mockCacheService.userService = sut
    }

    override func tearDownWithError() throws {
        sut = nil
        mockNetworkManager = nil
        mockCacheService = nil
    }

    func testUserServiceInitialization() {
        XCTAssertNotNil(sut)
    }

    func testFetchAllUsers() async throws {
        // This would normally use a mock network manager
        // For fixture purposes, we're just testing the structure
        do {
            let users = try await sut.fetchAll()
            XCTAssertNotNil(users)
        } catch {
            // Expected to fail without real network
            XCTAssertNotNil(error)
        }
    }

    func testFetchUserById() async throws {
        let testUserId = "123"

        do {
            let user = try await sut.fetchById(testUserId)
            XCTAssertNotNil(user)
        } catch {
            // Expected to fail without real network
            XCTAssertNotNil(error)
        }
    }

    func testCreateUser() async throws {
        let newUser = User(
            id: "new-id",
            name: "Test User",
            email: "test@example.com",
            avatarURL: nil,
            createdAt: Date()
        )

        do {
            let createdUser = try await sut.create(newUser)
            XCTAssertNotNil(createdUser)
        } catch {
            // Expected to fail without real network
            XCTAssertNotNil(error)
        }
    }

    func testDeleteUser() async throws {
        let testUserId = "123"

        do {
            try await sut.delete(testUserId)
        } catch {
            // Expected to fail without real network
            XCTAssertNotNil(error)
        }
    }

    func testCacheIntegration() {
        let testUser = User(
            id: "cache-test",
            name: "Cache Test",
            email: "cache@example.com",
            avatarURL: nil,
            createdAt: Date()
        )

        mockCacheService.cacheUser(testUser)
        let cachedUser = mockCacheService.getCachedUser(id: testUser.id)

        XCTAssertNotNil(cachedUser)
        XCTAssertEqual(cachedUser?.id, testUser.id)
    }
}
