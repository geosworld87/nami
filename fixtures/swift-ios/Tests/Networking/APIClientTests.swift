import XCTest
@testable import SwiftIOSFixture

class APIClientTests: XCTestCase {

    var sut: APIClient!
    var mockNetworkManager: NetworkManager!

    override func setUpWithError() throws {
        mockNetworkManager = NetworkManager(baseURL: "https://test.api.com")
        sut = APIClient(networkManager: mockNetworkManager)
    }

    override func tearDownWithError() throws {
        sut = nil
        mockNetworkManager = nil
    }

    func testAPIClientInitialization() {
        XCTAssertNotNil(sut)
    }

    func testGetRequest() async throws {
        do {
            let _: [User] = try await sut.get(.users)
            XCTFail("Should throw without real network")
        } catch {
            XCTAssertNotNil(error)
        }
    }

    func testPostRequest() async throws {
        let newUser = User(
            id: "new",
            name: "New User",
            email: "new@example.com",
            avatarURL: nil,
            createdAt: Date()
        )

        do {
            let _: User = try await sut.post(.users, body: newUser)
            XCTFail("Should throw without real network")
        } catch {
            XCTAssertNotNil(error)
        }
    }

    func testDeleteRequest() async throws {
        do {
            let _: User = try await sut.delete(.user(id: "123"))
            XCTFail("Should throw without real network")
        } catch {
            XCTAssertNotNil(error)
        }
    }

    func testPutRequest() async throws {
        let updatedUser = User(
            id: "1",
            name: "Updated Name",
            email: "updated@example.com",
            avatarURL: nil,
            createdAt: Date()
        )

        do {
            let _: User = try await sut.put(.user(id: "1"), body: updatedUser)
            XCTFail("Should throw without real network")
        } catch {
            XCTAssertNotNil(error)
        }
    }
}
