import XCTest
@testable import SwiftIOSFixture

class UserTests: XCTestCase {

    func testUserInitialization() {
        let user = User(
            id: "1",
            name: "John Doe",
            email: "john@example.com",
            avatarURL: nil,
            createdAt: Date()
        )

        XCTAssertEqual(user.id, "1")
        XCTAssertEqual(user.name, "John Doe")
        XCTAssertEqual(user.email, "john@example.com")
        XCTAssertNil(user.avatarURL)
    }

    func testDisplayNameReturnsNameWhenPresent() {
        let user = User(
            id: "1",
            name: "John Doe",
            email: "john@example.com",
            avatarURL: nil,
            createdAt: Date()
        )
        XCTAssertEqual(user.displayName, "John Doe")
    }

    func testDisplayNameReturnsEmailWhenNameEmpty() {
        let user = User(
            id: "1",
            name: "",
            email: "john@example.com",
            avatarURL: nil,
            createdAt: Date()
        )
        XCTAssertEqual(user.displayName, "john@example.com")
    }

    func testUserEquality() {
        let date = Date()
        let user1 = User(id: "1", name: "John", email: "john@test.com", avatarURL: nil, createdAt: date)
        let user2 = User(id: "1", name: "John", email: "john@test.com", avatarURL: nil, createdAt: date)
        XCTAssertEqual(user1, user2)
    }

    func testUserCodable() throws {
        let user = User(
            id: "1",
            name: "John",
            email: "john@test.com",
            avatarURL: URL(string: "https://example.com/avatar.png"),
            createdAt: Date()
        )

        let data = try JSONEncoder().encode(user)
        let decoded = try JSONDecoder().decode(User.self, from: data)
        XCTAssertEqual(decoded.id, user.id)
        XCTAssertEqual(decoded.name, user.name)
    }
}
